# Broad Board

A tile rotation puzzle — match the target pattern by rotating 2×2 blocks.

**How to play**
- Hover a tile to highlight a 2×2 block
- Click or tap to rotate that block 90° clockwise
- Choose a target pattern from the dropdown (board resizes to match)
- Use **Randomize** for a new scramble

**Sizes & patterns**
- Boards from **4×4** through **16×16** (even sizes)
- **252 patterns**: 18 black & white + 18 color per size
- Patterns live in `patterns/black-and-white/` and `patterns/color/` as individual JSON files

**Play online**  
https://jorobertmac.github.io/broadboard/

Built as a lightweight vanilla HTML/CSS/JS web app. Serve over HTTP so pattern JSON can load via `fetch`.
