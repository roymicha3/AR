"""Add a material to public/models/lattice.usdz.

The Meshy-generated USDZ has no material at all. iOS AR Quick Look renders
material-less meshes with a purple placeholder colour. This script opens the
USDC, creates a UsdPreviewSurface material, binds it to the mesh, and repacks
the result as a valid (ZIP_STORED) USDZ.

Usage:
    python3 scripts/fix-usdz.py                    # default white
    python3 scripts/fix-usdz.py --color "#e8d5b0"  # hex
    python3 scripts/fix-usdz.py --color 0.9 0.5 0.2  # R G B floats 0-1
    python3 scripts/fix-usdz.py --metallic 0.8 --roughness 0.2

    Via npm:
    npm run fix-usdz -- --color "#c0a080"

Requires:
    pip3 install usd-core  (one-time)
"""

import argparse
import os
import shutil
import tempfile
import zipfile

from pxr import Gf, Sdf, Usd, UsdGeom, UsdShade

USDZ_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), '..', 'public', 'models', 'lattice.usdz')
)


def parse_color(args) -> Gf.Vec3f:
    """Return a Gf.Vec3f from --color argument (hex string or 3 floats)."""
    if not args.color:
        return Gf.Vec3f(0.9, 0.9, 0.9)
    if len(args.color) == 1:
        # Hex string: #RRGGBB or RRGGBB
        hex_str = args.color[0].lstrip('#')
        if len(hex_str) != 6:
            raise ValueError(f"Invalid hex color: {args.color[0]!r} — expected #RRGGBB")
        r, g, b = (int(hex_str[i:i+2], 16) / 255.0 for i in (0, 2, 4))
        return Gf.Vec3f(r, g, b)
    if len(args.color) == 3:
        r, g, b = (float(v) for v in args.color)
        return Gf.Vec3f(r, g, b)
    raise ValueError("--color takes either one hex value (#RRGGBB) or three floats (R G B)")


def add_material(usdc_path: str, diffuse: Gf.Vec3f, metallic: float, roughness: float) -> None:
    stage = Usd.Stage.Open(usdc_path)

    mesh_prim = None
    for prim in stage.Traverse():
        if prim.IsA(UsdGeom.Mesh):
            mesh_prim = prim
            break
    if mesh_prim is None:
        raise RuntimeError("No Mesh prim found in stage.")
    print(f"Mesh: {mesh_prim.GetPath()}")

    mat_path    = Sdf.Path("/Materials/Default")
    shader_path = Sdf.Path("/Materials/Default/PBRShader")

    material = UsdShade.Material.Define(stage, mat_path)
    shader   = UsdShade.Shader.Define(stage, shader_path)

    shader.CreateIdAttr("UsdPreviewSurface")
    shader.CreateInput("diffuseColor",  Sdf.ValueTypeNames.Color3f).Set(diffuse)
    shader.CreateInput("emissiveColor", Sdf.ValueTypeNames.Color3f).Set(Gf.Vec3f(0, 0, 0))
    shader.CreateInput("metallic",      Sdf.ValueTypeNames.Float).Set(metallic)
    shader.CreateInput("roughness",     Sdf.ValueTypeNames.Float).Set(roughness)
    shader.CreateInput("opacity",       Sdf.ValueTypeNames.Float).Set(1.0)

    surface_out = shader.CreateOutput("surface", Sdf.ValueTypeNames.Token)
    material.CreateSurfaceOutput().ConnectToSource(surface_out)

    UsdShade.MaterialBindingAPI.Apply(mesh_prim).Bind(material)

    stage.Save()
    print(f"Material bound at {mat_path}")
    print(f"  diffuseColor={diffuse}  metallic={metallic}  roughness={roughness}")


def repack_usdz(usdc_path: str, out_path: str) -> None:
    with zipfile.ZipFile(out_path, 'w', compression=zipfile.ZIP_STORED) as zf:
        zf.write(usdc_path, arcname='model.usdc')
    print(f"Repacked → {out_path}  ({os.path.getsize(out_path):,} bytes)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply/update material on lattice.usdz")
    parser.add_argument(
        'input', nargs='?', default=None,
        metavar='PATH',
        help='Path to the .usdz file (default: public/models/lattice.usdz)'
    )
    parser.add_argument(
        '--color', nargs='+', metavar='VALUE',
        help='Diffuse colour: "#RRGGBB" or R G B floats (0-1). Default: 0.9 0.9 0.9'
    )
    parser.add_argument('--metallic',  type=float, default=0.0,  help='Metallic factor 0-1 (default 0)')
    parser.add_argument('--roughness', type=float, default=0.55, help='Roughness factor 0-1 (default 0.55)')
    args = parser.parse_args()

    diffuse = parse_color(args)

    usdz_path = os.path.normpath(args.input) if args.input else USDZ_PATH
    print(f"Source: {usdz_path}")
    with tempfile.TemporaryDirectory() as tmp:
        with zipfile.ZipFile(usdz_path, 'r') as zf:
            usdc_name = zf.namelist()[0]
            usdc_path = zf.extract(usdc_name, tmp)
        print(f"Extracted: {usdc_name}  ({os.path.getsize(usdc_path):,} bytes)")

        add_material(usdc_path, diffuse, args.metallic, args.roughness)

        fixed = os.path.join(tmp, 'fixed.usdz')
        repack_usdz(usdc_path, fixed)
        shutil.copy2(fixed, usdz_path)

    print("Done.")


if __name__ == '__main__':
    main()
