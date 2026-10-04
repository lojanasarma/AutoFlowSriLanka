"""Make near-white/grey grid backgrounds transparent in an image.

Usage: python remove_light_background.py INPUT_IMAGE OUTPUT_IMAGE
"""

import argparse
from pathlib import Path

from PIL import Image


def remove_light_background(input_path: Path, output_path: Path) -> None:
    image = Image.open(input_path).convert("RGBA")
    pixels = []
    for red, green, blue, alpha in image.getdata():
        is_neutral_light = min(red, green, blue) > 200 and max(red, green, blue) - min(red, green, blue) < 15
        pixels.append((255, 255, 255, 0) if is_neutral_light else (red, green, blue, alpha))
    image.putdata(pixels)
    image.save(output_path, "PNG")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    remove_light_background(args.input, args.output)
