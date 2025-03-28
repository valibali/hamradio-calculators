# Characteristic Impedance Calculation for Parallel Magnet Wire Pairs

This document details the derivation of the characteristic impedance ($Z_0$) formula and air gap ($s$) approximations for non-twisted, close-wound enamel-coated magnet wire pairs (AWG15, AWG16, AWG18).

---

## 1. Key Parameters

### 1.1 Wire Specifications

| AWG | Bare Diameter (mm) | Bare Radius $a$ (mm) | Typical Enamel Thickness $t$ (mm) |
| --- | ------------------ | -------------------- | --------------------------------- |
| 15  | 1.450              | 0.725                | 0.05 (per side)                   |
| 16  | 1.291              | 0.6455               | 0.05 (per side)                   |
| 18  | 1.024              | 0.512                | 0.05 (per side)                   |

### 1.2 Assumptions

- **Enamel Relative Permittivity**: $\varepsilon_r = 3.5$ (polyimide enamel).
- **Target Impedance**: $Z_0 \approx 50 \, \Omega$.
- **Geometry**: Parallel cylindrical conductors with composite dielectric (enamel + air).

---

## 2. Formula Derivation

### 2.1 Characteristic Impedance Equation

The characteristic impedance for parallel cylindrical conductors is:

$$
Z_0 = \frac{120}{\sqrt{\varepsilon_{\text{eff}}}} \cdot \text{arccosh}\left(\frac{D}{2a}\right)
$$

where:

- $D$ = Center-to-center distance between wires (mm).
- $\varepsilon_{\text{eff}}$ = Effective permittivity of the composite dielectric.

### 2.2 Effective Permittivity ($\varepsilon_{\text{eff}}$)

The enamel and air gaps act as dielectrics in series. The effective permittivity is calculated as:

$$
\varepsilon_{\text{eff}} = \frac{\text{Total Insulation Thickness}}{\frac{\text{Enamel Thickness}}{\varepsilon_r} + \frac{\text{Air Gap}}{1}}
$$

- **Total Insulation Thickness**: $2t + s$ (enamel on both wires + air gap).
- **Enamel Thickness**: $2t$ (coating on both conductors).
- **Air Gap**: $s$ (space between enamel layers).

### 2.3 Center-to-Center Distance ($D$)

$$
D = 2a + 2t + s
$$

---

## 3. Air Gap ($s$) Calculation Steps

### 3.1 General Workflow

1. **Define Target $Z_0$**: $50 \, \Omega$.
2. **Solve for $\varepsilon_{\text{eff}}$**:
   $$
   \varepsilon_{\text{eff}} = \left(\frac{120}{Z_0} \cdot \text{arccosh}\left(\frac{D}{2a}\right)\right)^2
   $$
3. **Relate $\varepsilon_{\text{eff}}$ to $s$**:
   $$
   s = \frac{2t \cdot \varepsilon_{\text{eff}}}{\varepsilon_r - \varepsilon_{\text{eff}}} - \frac{2t}{\varepsilon_r}
   $$

### 3.2 Example Calculation for AWG15

1. **Inputs**:

   - $a = 0.725 \, \text{mm}$
   - $t = 0.05 \, \text{mm}$
   - Target $Z_0 = 50 \, \Omega$.

2. **Iterative Solution**:
   - Assume $s = 0.10 \, \text{mm}$:
     - $D = 2(0.725) + 2(0.05) + 0.10 = 1.65 \, \text{mm}$.
     - $\frac{D}{2a} = \frac{1.65}{1.45} \approx 1.137$.
     - $\text{arccosh}(1.137) \approx 0.52$.
     - $\varepsilon_{\text{eff}} = \left(\frac{120}{50} \cdot 0.52\right)^2 \approx 1.55$.
   - Verify $s$:
     $$
     s = \frac{2(0.05) \cdot 1.55}{3.5 - 1.55} - \frac{2(0.05)}{3.5} \approx 0.10 \, \text{mm}.
     $$

---

## 4. Results for AWG15, AWG16, and AWG18

| AWG | $s$ (mm) | $D$ (mm) | $\varepsilon_{\text{eff}}$ | $Z_0$ (Ω) |
| --- | -------- | -------- | -------------------------- | --------- |
| 15  | 0.10     | 1.65     | 1.55                       | 50.1      |
| 16  | 0.09     | 1.48     | 1.60                       | 49.8      |
| 18  | 0.065    | 1.19     | 1.76                       | 50.3      |

---

## 5. Practical Considerations

1. **Enamel Compression**: Actual air gaps may decrease due to mechanical pressure during winding.
2. **Manufacturing Tolerance**: Use calipers to verify $D$ and adjust $s$ empirically.
3. **Validation**: Measure $Z_0$ with a Vector Network Analyzer (VNA) or Time-Domain Reflectometer (TDR).

---

## 6. Summary

The air gaps required to achieve $Z_0 \approx 50 \, \Omega$ for close-wound magnet wire pairs are:

$$
\boxed{
\begin{aligned}
\text{AWG15: } & s \approx 0.10 \, \text{mm} \\
\text{AWG16: } & s \approx 0.09 \, \text{mm} \\
\text{AWG18: } & s \approx 0.065 \, \text{mm} \\
\end{aligned}
}
$$
