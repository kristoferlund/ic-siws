use std::str::FromStr;

use ic_cdk::query;
use ic_siwe::solana::SolPubkey;
use serde_bytes::ByteBuf;

use crate::{ADDRESS_PRINCIPAL, SETTINGS};

/// Retrieves the principal associated with the given Ethereum address.
///
/// # Arguments
/// * `address` - The EIP-55-compliant Ethereum address.
///
/// # Returns
/// * `Ok(ByteBuf)` - The principal if found.
/// * `Err(String)` - An error message if the address cannot be converted or no principal is found.
#[query]
fn get_principal(pubkey: String) -> Result<ByteBuf, String> {
    SETTINGS.with_borrow(|s| {
        if s.disable_eth_to_principal_mapping {
            return Err("Solana pubkey to principal mapping is disabled".to_string());
        }
        Ok(())
    })?;

    let pubkey = SolPubkey::from_str(pubkey.as_str()).map_err(|e| e.to_string())?;

    ADDRESS_PRINCIPAL.with(|ap| {
        ap.borrow().get(&pubkey.to_bytes()).map_or(
            Err("No principal found for the given pubkey".to_string()),
            |p| Ok(ByteBuf::from(p.as_ref().to_vec())),
        )
    })
}
