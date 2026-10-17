# Mars retrograde widget

Interactive comparison of the Ptolemaic, Copernican and Tychonic explanations of Mars's retrograde motion, using each astronomer's own parameters.

- `index.html`: the 2D version. Open it directly in a browser.
- `index3d.html`: the 3D version, with latitudes, a rotatable diagram and the loop in the sky. Generated; don't edit it by hand.
- `tools/script3d.js`: the 3D page's script.
- `tools/build3d.py`: builds `index3d.html` from `index.html`'s markup and styles plus `tools/script3d.js`.

Rebuild the 3D page after editing either source:

```
python3 tools/build3d.py index.html tools/script3d.js index3d.html
```
