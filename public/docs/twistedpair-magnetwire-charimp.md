# Characteristic Impedance Calculation for Twisted Pair Magnet Wire

This document provides the complete derivation of characteristic impedance formulas for enamel-coated twisted pair magnet wire, including practical considerations for common AWG gauges.

## 1. Fundamental Theory

### 1.1 Transmission Line Basics

The characteristic impedance ($Z_0$) of a balanced twisted pair is given by:

$$
Z_0 = \sqrt{\frac{L'}{C'}}
$$

Where:

- $L'$ = Inductance per unit length (H/m)
- $C'$ = Capacitance per unit length (F/m)

### 1.2 Geometric Considerations

For twisted pairs, we must account for:

- Helical conductor geometry
- Composite dielectric (enamel + air)
- Proximity effects

## 2. Complete Derivation

### 2.1 Capacitance Calculation

The capacitance between conductors is:

$$
C' = \frac{\pi\epsilon_0\epsilon_{eff}}{\ln\left(\frac{s}{r} + \sqrt{\left(\frac{s}{r}\right)^2 - 1}\right)}
$$

Where:

- $s$ = Center-to-center spacing (m)
- $r$ = Conductor radius including insulation (m)
- $\epsilon_{eff}$ = Effective relative permittivity

### 2.2 Inductance Calculation

The inductance per unit length is:

$$
L' = \frac{\mu_0}{\pi}\ln\left(\frac{s}{r} + \sqrt{\left(\frac{s}{r}\right)^2 - 1}\right)
$$

### 2.3 Combined Impedance Formula

Substituting $L'$ and $C'$ gives:

$$
Z_0 = \frac{1}{\pi}\sqrt{\frac{\mu_0}{\epsilon_0\epsilon_{eff}}}\ln\left(\frac{s}{r} + \sqrt{\left(\frac{s}{r}\right)^2 - 1}\right)
$$

Simplifying with constants:

$$
Z_0 = \frac{120}{\sqrt{\epsilon_{eff}}}\ln\left(\frac{s}{r} + \sqrt{\left(\frac{s}{r}\right)^2 - 1}\right)
$$

## 3. Practical Implementation

### 3.1 Effective Permittivity

For enamel-coated wires:

$$
\epsilon_{eff} = \frac{\epsilon_{enamel}t_{enamel} + \epsilon_{air}t_{air}}{t_{total}}
$$

Typical values:

- $\epsilon_{enamel}$ ≈ 3.5
- $\epsilon_{air}$ = 1.0
- $t_{enamel}$ = 0.02-0.1mm per side
- $t_{air}$ ≈ 0.05-0.3mm (depends on twist tightness)

### 3.2 Geometric Parameters

For twisted pairs:

- $s \approx \frac{p}{\pi}$ (p = twist pitch)
- $r = r_{conductor} + t_{enamel}$

## 4. Example Calculation (AWG24)

### Parameters:

- Bare diameter: 0.511mm
- Enamel thickness: 0.03mm
- Twist pitch: 10mm
- $\epsilon_{eff}$ ≈ 1.8

### Calculations:

1. $r = (0.511 + 2×0.03)/2 = 0.2855$ mm
2. $s ≈ 10/\pi = 3.183$ mm
3. $s/r ≈ 11.15$
4. $Z_0 = \frac{120}{\sqrt{1.8}}\ln(11.15 + \sqrt{11.15^2-1}) ≈ 94.3Ω$

## 5. Reference Tables

### Impedance vs. AWG (Typical Values)

| AWG | Bare Diameter (mm) | $Z_0$ Range (Ω) |
| --- | ------------------ | --------------- |
| 22  | 0.644              | 90-110          |
| 24  | 0.511              | 95-115          |
| 26  | 0.405              | 100-120         |

### Effect of Twist Pitch

| TPI | $Z_0$ Multiplier |
| --- | ---------------- |
| 10  | 1.00             |
| 20  | 0.95             |
| 5   | 1.05             |

## 6. Practical Considerations

1. **Enamel Properties**:

   - Actual dielectric constant varies by manufacturer
   - Measure with TDR for critical applications

2. **Twist Consistency**:

   - Non-uniform twisting affects impedance
   - Industrial twisters provide better consistency

3. **Frequency Effects**:

   - Skin effect becomes significant above 1MHz
   - Proximity effect changes effective resistance

## 7. MATLAB/Python Implementation

```python
import numpy as np

def twisted_pair_z0(awg, enamel_thickness, twist_pitch, epsilon_r=3.5):
    # Convert AWG to diameter (mm)
    bare_dia = 0.127 * 92**((36-awg)/39)
    r = (bare_dia + 2*enamel_thickness)/2

    # Effective spacing
    s = twist_pitch/np.pi

    # Effective permittivity (simplified)
    epsilon_eff = 1 + (epsilon_r-1)*(enamel_thickness*2/(s*2))

    # Impedance calculation
    ratio = s/r
    z0 = (120/np.sqrt(epsilon_eff)) * np.log(ratio + np.sqrt(ratio**2 - 1))

    return z0
```
