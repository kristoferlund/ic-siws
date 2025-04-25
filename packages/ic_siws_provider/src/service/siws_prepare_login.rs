use std::str::FromStr;

use ic_cdk::update;
use ic_siws::{siws::SiwsMessage, solana::SolPubkey};
/// Prepares a SIWS login by generating a challenge message (SIWS message) for the given Solana public key.
///
/// # Arguments
/// * `pubkey` - The Solana public key as a base-58 encoded string.
///
/// # Returns
/// * `Ok(SiwsMessage)` containing the SIWS challenge message.
/// * `Err(String)` if the provided public key string is invalid.
#[update]
fn siws_prepare_login(pubkey: String) -> Result<SiwsMessage, String> {
    // Attempt to create a Pubkey from the string. This validates the PK.
    let pubkey = SolPubkey::from_str(pubkey.as_str()).map_err(|e| e.to_string())?;

    Ok(ic_siws::login::prepare_login(&pubkey))
}
