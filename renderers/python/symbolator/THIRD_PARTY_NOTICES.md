# Third-party notices

The compatibility target is Symbolator 1.2.2 by Kevin Thibedeau and
contributors, released under the MIT license:

https://github.com/zebreus/symbolator/tree/v1.2.2

The Worker does not vendor its Cairo/Pango-dependent implementation. The HDL
grammar and output conventions are reimplemented here as a deliberately small
translation path because those native dependencies cannot run in Pyodide.
