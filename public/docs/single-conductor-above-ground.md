# Single Conductor Above Ground Plane Impedance Calculator

## Formula

The characteristic impedance (Z₀) of a single conductor above a ground plane is given by:

$$
Z_0 = \frac{138}{\sqrt{\epsilon}} \log_{10}\left(\frac{4h}{d}\right)
$$

Where:

- $Z_0$ = Characteristic impedance (Ω)
- $\epsilon$ = Dielectric constant of the medium (ε = 1 for air)
- $h$ = Height of conductor above ground plane (mm)
- $d$ = Diameter of conductor (mm)

## Derivation

This formula is derived from the capacitance per unit length of a cylindrical conductor parallel to a ground plane. The logarithmic relationship comes from the solution to Laplace's equation in cylindrical coordinates.

## Assumptions

1. The conductor diameter $d$ is much smaller than the height $h$ ($d \ll h$)
2. The ground plane is perfectly conducting and infinite in extent
3. The conductor is perfectly cylindrical and parallel to the ground plane

## Applications

- Antenna feed lines
- PCB trace impedance calculations
- Overhead power line modeling
- Railway electrification systems

## Reverse Calculation

To find the required height $h$ for a target impedance:

$$
h = \frac{d}{4} \times 10^{\frac{Z_0 \sqrt{\epsilon}}{138}}
$$

## Example Calculation

For a 1mm diameter wire 10mm above ground in air (ε=1):

$$
Z_0 = \frac{138}{\sqrt{1}} \log_{10}\left(\frac{4 \times 10}{1}\right) \approx 138 \times 1.602 \approx 221Ω
$$
