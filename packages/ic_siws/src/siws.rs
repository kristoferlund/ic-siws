use crate::{hash, settings::Settings, solana::SolPubkey, time::get_current_time, with_settings};
use candid::CandidType;
use ic_certified_map::Hash;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fmt};
use time::{macros::format_description, OffsetDateTime};

#[derive(Debug)]
pub enum SiwsMessageError {
    MessageNotFound,
}

impl fmt::Display for SiwsMessageError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SiwsMessageError::MessageNotFound => write!(f, "Message not found"),
        }
    }
}

impl From<SiwsMessageError> for String {
    fn from(error: SiwsMessageError) -> Self {
        error.to_string()
    }
}

/// Constructs a new [`SiwsMessage`] for a given Solana address using the settings defined in the
/// global [`Settings`] struct.
///
/// # Arguments
///
/// * `address`: The Solana address of the user.
///
/// # Returns
///
/// A `Result` that, on success, contains a new [`SiwsMessage`] instance.
#[derive(Serialize, Deserialize, Debug, Clone, CandidType)]
pub struct SiwsMessage {
    // RFC 4501 dns authority that is requesting the signing.
    pub domain: String,

    // Solana address performing the signing
    pub address: String,

    // Human-readable ASCII assertion for the user to sign; optional and must not contain newline characters.
    pub statement: String,

    // RFC 3986 URI referring to the resource that is the subject of the signing
    pub uri: String,

    // Current version of the message.
    pub version: u32,

    // Chain ID to which the session is bound, optional
    pub chain_id: String,

    // Randomized token used to prevent replay attacks
    pub nonce: String,

    /// Timestamp in nanoseconds
    pub issued_at: u64,

    /// Timestamp in nanoseconds
    pub expiration_time: u64,
}

impl SiwsMessage {
    pub fn new(pubkey: &SolPubkey, nonce: &str) -> SiwsMessage {
        let current_time = get_current_time();
        with_settings!(|settings: &Settings| {
            SiwsMessage {
                domain: settings.domain.clone(),
                address: pubkey.to_string(),
                statement: settings.statement.clone(),
                uri: settings.uri.clone(),
                version: 1,
                chain_id: settings.chain_id.clone(),
                nonce: nonce.to_string(),
                issued_at: get_current_time(),
                expiration_time: current_time.saturating_add(settings.sign_in_expires_in),
            }
        })
    }

    /// Checks if the SIWS message is currently valid.
    ///
    /// # Returns
    ///
    /// `true` if the message is within its valid time period, `false` otherwise.
    pub fn is_expired(&self) -> bool {
        let current_time = get_current_time();
        self.issued_at < current_time || current_time > self.expiration_time
    }
}

impl fmt::Display for SiwsMessage {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let json = serde_json::to_string(self).map_err(|_| fmt::Error)?;
        write!(f, "{}", json)
    }
}

impl From<SiwsMessage> for String {
    fn from(val: SiwsMessage) -> Self {
        // Custom date format to match the JS ISO 8601 format that has less precision than the default Rfc3339 format.
        let js_iso_format = format_description!(
            "[year]-[month]-[day]T[hour]:[minute]:[second].[subsecond digits:3]Z"
        );

        let issued_at_datetime =
            OffsetDateTime::from_unix_timestamp_nanos(val.issued_at as i128).unwrap();
        let issued_at_iso_8601 = issued_at_datetime.format(&js_iso_format).unwrap();

        let expiration_datetime =
            OffsetDateTime::from_unix_timestamp_nanos(val.expiration_time as i128).unwrap();
        let expiration_iso_8601 = expiration_datetime.format(&js_iso_format).unwrap();

        format!(
            "{domain} wants you to sign in with your Solana account:\n\
            {address}\n\
            \n\
            {statement}\n\
            \n\
            URI: {uri}\n\
            Version: {version}\n\
            Chain ID: {chain_id}\n\
            Nonce: {nonce}\n\
            Issued At: {issued_at_iso_8601}\n\
            Expiration Time: {expiration_iso_8601}",
            domain = val.domain,
            address = val.address,
            statement = val.statement,
            uri = val.uri,
            version = val.version,
            chain_id = val.chain_id,
            nonce = val.nonce,
        )
    }
}

/// The SiwsMessageMap map hash is the hash of the caller pubkey and the message nonce.
/// This ensures every call to `siws_prepare_login` leads to one new copy of the SIWS message being stored.
pub fn siws_message_map_hash(pubkey: &SolPubkey, nonce: &str) -> Hash {
    let mut bytes: Vec<u8> = vec![];

    let pubkey_bytes = pubkey.to_bytes();
    bytes.push(pubkey_bytes.len() as u8);
    bytes.extend(pubkey_bytes);

    let nonce_bytes = nonce.as_bytes();
    bytes.push(nonce_bytes.len() as u8);
    bytes.extend(nonce_bytes);

    hash::hash_bytes(bytes)
}

/// The SiwsMessageMap is a map of SIWS messages keyed by the Solana address of the user. SIWS messages
/// are stored in the map during the course of the login process and are removed once the login process
/// is complete. The map is also pruned periodically to remove expired SIWS messages.
pub struct SiwsMessageMap {
    map: HashMap<[u8; 32], SiwsMessage>,
}

impl SiwsMessageMap {
    pub fn new() -> SiwsMessageMap {
        SiwsMessageMap {
            map: HashMap::new(),
        }
    }

    /// Removes SIWS messages that have exceeded their time to live.
    pub fn prune_expired(&mut self) {
        let current_time = get_current_time();
        self.map
            .retain(|_, message| message.expiration_time > current_time);
    }

    /// Adds a SIWS message to the map.
    pub fn insert(&mut self, pubkey: &SolPubkey, message: SiwsMessage, nonce: &str) {
        let hash = siws_message_map_hash(pubkey, nonce);
        self.map.insert(hash, message);
    }

    /// Returns a cloned SIWS message associated with the provided address or an error if the message
    /// does not exist.
    pub fn get(&self, pubkey: &SolPubkey, nonce: &str) -> Result<SiwsMessage, SiwsMessageError> {
        let hash = siws_message_map_hash(pubkey, nonce);
        self.map
            .get(&hash)
            .cloned()
            .ok_or(SiwsMessageError::MessageNotFound)
    }

    /// Removes the SIWS message associated with the provided address.
    pub fn remove(&mut self, pubkey: &SolPubkey, nonce: &str) {
        let hash = siws_message_map_hash(pubkey, nonce);
        self.map.remove(&hash);
    }
}

impl Default for SiwsMessageMap {
    fn default() -> Self {
        Self::new()
    }
}
