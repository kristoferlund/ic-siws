use std::str::FromStr;

use ic_cdk::update;
use ic_siwe::{siws::SiwsMessage, solana::SolPubkey};
// Prepare the login by generating a challenge (the SIWE message) and returning it to the caller.
#[update]
fn siwe_prepare_login(pubkey: String) -> Result<SiwsMessage, String> {
    // Attempt to create a Pubkey from the string. This validates the PK.
    let pubkey = SolPubkey::from_str(pubkey.as_str()).map_err(|e| e.to_string())?;

    Ok(ic_siwe::login::prepare_login(&pubkey))
}
