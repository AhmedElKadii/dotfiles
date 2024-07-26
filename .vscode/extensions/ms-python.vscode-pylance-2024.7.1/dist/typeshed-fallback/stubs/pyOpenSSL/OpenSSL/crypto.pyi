from _typeshed import Incomplete, StrOrBytesPath
from collections.abc import Callable, Iterable, Sequence
from datetime import datetime
from typing import Any
from typing_extensions import TypeAlias, deprecated

from cryptography.hazmat.primitives.asymmetric.dsa import DSAPrivateKey, DSAPublicKey
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey, RSAPublicKey
from cryptography.x509 import Certificate, CertificateRevocationList, CertificateSigningRequest

_Key: TypeAlias = DSAPrivateKey | DSAPublicKey | RSAPrivateKey | RSAPublicKey

FILETYPE_PEM: int
FILETYPE_ASN1: int
FILETYPE_TEXT: int

TYPE_RSA: int
TYPE_DSA: int
TYPE_DH: int
TYPE_EC: int

class _EllipticCurve:
    def __init__(self, lib: Incomplete | None, nid: int, name: str) -> None: ...

class Error(Exception): ...

class PKey:
    def __init__(self) -> None: ...
    def bits(self) -> int: ...
    def check(self) -> bool: ...
    @classmethod
    def from_cryptography_key(cls, crypto_key: _Key) -> PKey: ...
    def generate_key(self, type: int, bits: int) -> None: ...
    def to_cryptography_key(self) -> _Key: ...
    def type(self) -> int: ...

class X509Name:
    countryName: str
    C: str
    stateOrProvinceName: str
    ST: str
    localityName: str
    L: str
    organizationName: str
    O: str
    organizationalUnitName: str
    OU: str
    commonName: str
    CN: str
    emailAddress: str
    def __init__(self, name: X509Name) -> None: ...
    def der(self) -> bytes: ...
    def get_components(self) -> list[tuple[bytes, bytes]]: ...
    def hash(self) -> int: ...

class X509:
    def __init__(self) -> None: ...
    def add_extensions(self, extensions: Iterable[X509Extension]) -> None: ...
    def digest(self, digest_name: str) -> bytes: ...
    @classmethod
    def from_cryptography(cls, crypto_cert: Certificate) -> X509: ...
    def get_extension(self, index: int) -> X509Extension: ...
    def get_extension_count(self) -> int: ...
    def get_issuer(self) -> X509Name: ...
    def get_notAfter(self) -> bytes | None: ...
    def get_notBefore(self) -> bytes | None: ...
    def get_pubkey(self) -> PKey: ...
    def get_serial_number(self) -> int: ...
    def get_signature_algorithm(self) -> bytes: ...
    def get_subject(self) -> X509Name: ...
    def get_version(self) -> int: ...
    def gmtime_adj_notAfter(self, amount: int) -> None: ...
    def gmtime_adj_notBefore(self, amount: int) -> None: ...
    def has_expired(self) -> bool: ...
    def set_issuer(self, issuer: X509Name) -> None: ...
    def set_notAfter(self, when: bytes) -> None: ...
    def set_notBefore(self, when: bytes) -> None: ...
    def set_pubkey(self, pkey: PKey) -> None: ...
    def set_serial_number(self, serial: int) -> None: ...
    def set_subject(self, subject: X509Name) -> None: ...
    def set_version(self, version: int) -> None: ...
    def sign(self, pkey: PKey, digest: str) -> None: ...
    def subject_name_hash(self) -> bytes: ...
    def to_cryptography(self) -> Certificate: ...

class X509Req:
    def __init__(self) -> None: ...
    def add_extensions(self, extensions: Iterable[X509Extension]) -> None: ...
    @classmethod
    def from_cryptography(cls, crypto_req: CertificateSigningRequest) -> X509Req: ...
    def get_extensions(self) -> list[X509Extension]: ...
    def get_pubkey(self) -> PKey: ...
    def get_subject(self) -> X509Name: ...
    def get_version(self) -> int: ...
    def set_pubkey(self, pkey: PKey) -> None: ...
    def set_version(self, version: int) -> None: ...
    def sign(self, pkey: PKey, digest: str) -> None: ...
    def to_cryptography(self) -> CertificateSigningRequest: ...
    def verify(self, pkey: PKey) -> bool: ...

@deprecated("X509Extension support in pyOpenSSL is deprecated. You should use the APIs in cryptography.")
class X509Extension:
    def __init__(
        self, type_name: bytes, critical: bool, value: bytes, subject: X509 | None = None, issuer: X509 | None = None
    ) -> None: ...
    def get_critical(self) -> bool: ...
    def get_data(self) -> bytes: ...
    def get_short_name(self) -> bytes: ...

@deprecated("CRL support in pyOpenSSL is deprecated. You should use the APIs in cryptography.")
class Revoked:
    def __init__(self) -> None: ...
    def all_reasons(self) -> list[bytes]: ...
    def get_reason(self) -> bytes | None: ...
    def get_rev_date(self) -> bytes: ...
    def get_serial(self) -> bytes: ...
    def set_reason(self, reason: bytes | None) -> None: ...
    def set_rev_date(self, when: bytes) -> None: ...
    def set_serial(self, hex_str: bytes) -> None: ...

@deprecated("CRL support in pyOpenSSL is deprecated. You should use the APIs in cryptography.")
class CRL:
    def __init__(self) -> None: ...
    def add_revoked(self, revoked: Revoked) -> None: ...
    def export(self, cert: X509, key: PKey, type: int = 1, days: int = 100, digest: bytes = ...) -> bytes: ...
    @classmethod
    def from_cryptography(cls, crypto_crl: CertificateRevocationList) -> CRL: ...
    def get_issuer(self) -> X509Name: ...
    def get_revoked(self) -> tuple[Revoked, ...]: ...
    def set_lastUpdate(self, when: bytes) -> None: ...
    def set_nextUpdate(self, when: bytes) -> None: ...
    def set_version(self, version: int) -> None: ...
    def sign(self, issuer_cert: X509, issuer_key: PKey, digest: bytes) -> None: ...
    def to_cryptography(self) -> CertificateRevocationList: ...

class X509Store:
    def __init__(self) -> None: ...
    def add_cert(self, cert: X509) -> None: ...
    def add_crl(self, crl: CRL | CertificateRevocationList) -> None: ...
    def load_locations(self, cafile: StrOrBytesPath, capath: StrOrBytesPath | None = None) -> None: ...
    def set_flags(self, flags: int) -> None: ...
    def set_time(self, vfy_time: datetime) -> None: ...

class X509StoreContext:
    def __init__(self, store: X509Store, certificate: X509, chain: Sequence[X509] | None = None) -> None: ...
    def get_verified_chain(self) -> list[X509]: ...
    def set_store(self, store: X509Store) -> None: ...
    def verify_certificate(self) -> None: ...

class X509StoreContextError(Exception):
    errors: list[Any]
    certificate: X509
    def __init__(self, message: str, errors: list[Any], certificate: X509) -> None: ...

class X509StoreFlags:
    CRL_CHECK: int
    CRL_CHECK_ALL: int
    IGNORE_CRITICAL: int
    X509_STRICT: int
    ALLOW_PROXY_CERTS: int
    POLICY_CHECK: int
    EXPLICIT_POLICY: int
    INHIBIT_MAP: int
    NOTIFY_POLICY: int
    CHECK_SS_SIGNATURE: int
    CB_ISSUER_CHECK: int
    PARTIAL_CHAIN: int

def get_elliptic_curves() -> set[_EllipticCurve]: ...
def get_elliptic_curve(name: str) -> _EllipticCurve: ...
def dump_certificate(type: int, cert: X509) -> bytes: ...
def load_certificate(type: int, buffer: bytes) -> X509: ...
def dump_certificate_request(type: int, req: X509Req) -> bytes: ...
def load_certificate_request(type: int, buffer: bytes) -> X509Req: ...
def dump_privatekey(
    type: int, pkey: PKey, cipher: str | None = None, passphrase: bytes | Callable[[], bytes] | None = None
) -> bytes: ...
def load_privatekey(type: int, buffer: str | bytes, passphrase: bytes | Callable[[], bytes] | None = None) -> PKey: ...
def dump_publickey(type: int, pkey: PKey) -> bytes: ...
def load_publickey(type: int, buffer: str | bytes) -> PKey: ...
@deprecated("sign() is deprecated. Use the equivalent APIs in cryptography.")
def sign(pkey: PKey, data: str | bytes, digest: str) -> bytes: ...  # deprecated
@deprecated("verify() is deprecated. Use the equivalent APIs in cryptography.")
def verify(cert: X509, signature: bytes, data: str | bytes, digest: str) -> None: ...  # deprecated
@deprecated("CRL support in pyOpenSSL is deprecated. You should use the APIs in cryptography.")
def dump_crl(type: int, crl: CRL) -> bytes: ...
@deprecated("CRL support in pyOpenSSL is deprecated. You should use the APIs in cryptography.")
def load_crl(type: int, buffer: str | bytes) -> CRL: ...
