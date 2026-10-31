# CA bundle

`ca-bundle.pem` = the system trust store (`/etc/ssl/certs/ca-certificates.crt`)
plus two certificates published by Let's Encrypt:

| File | Subject | Issuer |
|---|---|---|
| `root-yr.pem` | `C=US, O=ISRG, CN=Root YR` | self-signed |
| `root-yr-by-x1.pem` | `C=US, O=ISRG, CN=Root YR` | `ISRG Root X1` (already trusted by the system) |

## Why this exists

`eprisons.nic.in` serves a valid leaf certificate issued by Let's Encrypt
intermediate `YR2`, which chains to the new ISRG root **Root YR**. That root is
not yet present in this machine's `ca-certificates` package, so `curl` and
OpenSSL reject the chain with `error 20: unable to get local issuer certificate`
even though the certificate is genuine and current.

The fix is ordinary trust-store maintenance: the cross-signed
`root-yr-by-x1.pem` chains Root YR up to `ISRG Root X1`, which the system
already trusts. Certificate verification therefore stays fully enabled
everywhere in this pipeline.

**No TLS verification is disabled anywhere in this project.** No
`--insecure` / `-k`, no `rejectUnauthorized: false`, no
`ignoreHTTPSErrors`. Chromium validates the same chain with its own bundled
root store and needed no change.

Both files were downloaded from `https://letsencrypt.org/certs/gen-y/` over a
connection that itself verified against the system store.
