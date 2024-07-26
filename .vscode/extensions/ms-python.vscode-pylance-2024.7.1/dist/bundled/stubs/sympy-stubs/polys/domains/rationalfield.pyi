from types import NotImplementedType
from typing import Any
from typing_extensions import Self

from sympy.core.numbers import Integer, Rational
from sympy.external.gmpy import MPQ
from sympy.external.pythonmpq import PythonMPQ
from sympy.polys.domains.characteristiczero import CharacteristicZero
from sympy.polys.domains.field import Field
from sympy.polys.domains.simpledomain import SimpleDomain

class RationalField(Field, CharacteristicZero, SimpleDomain):
    rep = ...
    alias = ...
    is_QQ = ...
    is_Numerical = ...
    has_assoc_Ring = ...
    has_assoc_Field = ...
    dtype = MPQ
    zero = dtype(0)
    one = dtype(1)
    tp = type(one)
    def __init__(self) -> None: ...
    def get_ring(self) -> Any: ...
    def to_sympy(self, a) -> Rational | Integer: ...
    def from_sympy(self, a) -> PythonMPQ: ...
    def algebraic_field(self, *extension, alias=...) -> Any: ...
    def from_AlgebraicField(K1, a, K0) -> None: ...
    def from_ZZ(K1, a, K0) -> PythonMPQ: ...
    def from_ZZ_python(K1, a, K0) -> PythonMPQ: ...
    def from_QQ(K1, a, K0) -> PythonMPQ: ...
    def from_QQ_python(K1, a, K0) -> PythonMPQ: ...
    def from_ZZ_gmpy(K1, a, K0) -> PythonMPQ: ...
    def from_QQ_gmpy(K1, a, K0): ...
    def from_GaussianRationalField(K1, a, K0) -> PythonMPQ | None: ...
    def from_RealField(K1, a, K0) -> PythonMPQ: ...
    def exquo(self, a, b) -> NotImplementedType | Self: ...
    def quo(self, a, b) -> NotImplementedType | Self: ...
    def rem(self, a, b) -> dtype: ...
    def div(self, a, b) -> tuple[NotImplementedType | Self, dtype]: ...
    def numer(self, a): ...
    def denom(self, a): ...

QQ = ...
