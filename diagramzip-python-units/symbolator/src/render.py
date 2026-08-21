from __future__ import annotations

import html
import math
import re
from dataclasses import dataclass, field

from protocol import BACKGROUND, KNOWN_OPTIONS, ProtocolError


MAX_SVG_LENGTH = 4_194_304


@dataclass
class Port:
    name: str
    direction: str
    data_type: str = ""
    bus: bool = False
    clock: bool = False
    bubble: bool = False
    group: str | None = None


@dataclass
class Component:
    name: str
    generics: list[Port] = field(default_factory=list)
    ports: list[Port] = field(default_factory=list)


GROUP = re.compile(r"\{\{\s*([^|}]+)?\s*\|\s*([^}]+)?\s*\}\}")
VERILOG_MODULE = re.compile(r"\bmodule\s+([A-Za-z_$][\w$]*)", re.IGNORECASE)
VHDL_ENTITY = re.compile(r"\b(?:entity|component)\s+([A-Za-z_]\w*)\s+is", re.IGNORECASE)


def _group(line: str) -> str | None:
    match = GROUP.search(line)
    if not match:
        return None
    return (match.group(2) or match.group(1) or "").strip() or None


def _clean(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", " ", text, flags=re.S)
    text = re.sub(r"//[^\n]*", "\n", text)
    return text


def _split_names(value: str) -> list[str]:
    return [part.strip() for part in value.split(",") if re.fullmatch(r"[A-Za-z_$][\w$]*", part.strip())]


def _verilog(source: str) -> list[Component]:
    components: list[Component] = []
    for module_match in VERILOG_MODULE.finditer(source):
        start = module_match.start()
        end = re.search(r"\bendmodule\b", source[module_match.end():], re.IGNORECASE)
        body = source[module_match.end(): module_match.end() + end.start() if end else len(source)]
        component = Component(module_match.group(1))
        pending_group: str | None = None
        for raw in body.splitlines():
            candidate_group = _group(raw)
            if candidate_group is not None:
                pending_group = candidate_group
                continue
            line = re.sub(r"\s+", " ", raw).strip()
            parameter = re.match(r"parameter(?:\s+\w+)?\s+([A-Za-z_$][\w$]*)", line, re.I)
            if parameter:
                component.generics.append(Port(parameter.group(1), "in", "", group=pending_group))
                pending_group = None
                continue
            # Header-style declarations may be comma-separated on one line;
            # split only at commas that introduce another direction so ranges
            # and ordinary name lists remain intact.
            for declaration in re.split(r",(?=\s*(?:input|output|inout)\b)", line, flags=re.I):
                declaration = declaration.strip().lstrip("(").rstrip(");").strip()
                port = re.match(
                    r"(?:input|output|inout)\s+(?:(?:wire|logic|reg|tri|signed|unsigned)\s+)*(?:(\[[^]]+\])\s*)?(.+?);?$",
                    declaration,
                    re.I,
                )
                if not port:
                    continue
                direction = re.match(r"(input|output|inout)", declaration, re.I).group(1).lower()
                direction = {"input": "in", "output": "out"}.get(direction, direction)
                data_type = port.group(1) or ""
                for name in _split_names(port.group(2).strip().rstrip(";")):
                    component.ports.append(Port(name, direction, data_type, bool(data_type), bool(re.search(r"clock", name, re.I)), bool(re.search(r"_[nb]$", name, re.I)), pending_group))
                pending_group = None
        components.append(component)
    return components


def _vhdl(source: str) -> list[Component]:
    components: list[Component] = []
    for match in VHDL_ENTITY.finditer(source):
        tail = source[match.end():]
        end = re.search(r"\bend\s+(?:entity|component)?\s*\w*\s*;", tail, re.I)
        body = tail[: end.start()] if end else tail
        component = Component(match.group(1))
        pending_group: str | None = None
        section = "ports"
        # Normalize compact declarations into the same statement stream as
        # the usual multiline VHDL style. Comments remain available for the
        # grouped-port form used by Symbolator.
        body = re.sub(r"\b(generic|port)\s*\(", r"\1 (\n", body, flags=re.I)
        body = body.replace(")", "\n)")
        for raw in body.splitlines():
            candidate_group = _group(raw)
            if candidate_group is not None:
                pending_group = candidate_group
                continue
            if re.search(r"\bgeneric\s*\(", raw, re.I):
                section = "generics"
                continue
            if re.search(r"\bport\s*\(", raw, re.I):
                section = "ports"
                continue
            line = re.sub(r"--[^\n]*", "", raw).strip().rstrip(";,)")
            item = re.match(r"(.+?)\s*:\s*(?:(in|out|inout|buffer)\s+)?(.+)$", line, re.I)
            if not item:
                continue
            names, direction, data_type = item.groups()
            direction = (direction or "in").lower()
            for name in _split_names(names.replace(" ", "")):
                is_bus = "(" in data_type or "vector" in data_type.lower()
                port = Port(name, direction, data_type.strip(), is_bus, bool(re.search(r"clock", name, re.I)), bool(re.search(r"_[nb]$", name, re.I)), pending_group)
                (component.generics if section == "generics" else component.ports).append(port)
            pending_group = None
        components.append(component)
    return components


def parse_components(source: str) -> list[Component]:
    clean = _clean(source)
    components = _verilog(source)
    return components or _vhdl(source)


def _text_width(text: str, size: float = 12) -> float:
    return max(1.0, len(re.sub(r"<[^>]+>", "", text)) * size * 0.62)


def _esc(text: str) -> str:
    return html.escape(text, quote=True)


def _text(x: float, y: float, value: str, anchor: str = "start", cls: str = "fnt1") -> str:
    return f'<text class="{cls}" x="{x:g}" y="{y:g}" text-anchor="{anchor}" dominant-baseline="middle">{_esc(value)}</text>'


def render_svg(
    source: str,
    options: dict[str, str] | None = None,
    *,
    title_text: str = "",
    description: str = "",
    presentation_background: str = "",
    presentation_padding: int = 0,
    presentation_frame: bool = False,
) -> tuple[str, str]:
    options = options or {}
    unknown = set(options) - KNOWN_OPTIONS
    if unknown:
        raise ProtocolError(400, "invalid_options", f"Unknown renderer option: {sorted(unknown)[0]}.")
    if "library-name" in options and "title" not in options:
        raise ProtocolError(400, "invalid_options", "options.library-name requires the title option.")
    if presentation_background and not BACKGROUND.fullmatch(presentation_background):
        raise ProtocolError(400, "invalid_presentation", "presentation.background must be an RGB hex color.")
    components = parse_components(source)
    if not components:
        raise ProtocolError(422, "render_failed", "No Verilog module or VHDL entity/component was found.")
    requested = options.get("component", "")
    if requested:
        components = [item for item in components if item.name == requested]
        if not components:
            raise ProtocolError(422, "render_failed", f"Component {requested} was not found.")
    component = components[-1]
    no_type = "no-type" in options
    title = "title" in options
    library = options.get("library-name", "")
    try:
        scale = float(options.get("scale", "1.0"))
    except ValueError as error:
        raise ProtocolError(400, "invalid_options", "options.scale must be numeric.") from error
    if not math.isfinite(scale) or scale <= 0 or scale > 16:
        raise ProtocolError(400, "invalid_options", "options.scale must be greater than zero and at most 16.")

    groups: list[tuple[str | None, list[Port]]] = []
    for port in component.ports:
        if groups and groups[-1][0] == port.group:
            groups[-1][1].append(port)
        else:
            groups.append((port.group, [port]))
    groups = [(name, ports) for name, ports in groups if ports]
    left = [port for _, ports in groups for port in ports if port.direction == "in"]
    right = [port for _, ports in groups for port in ports if port.direction in ("out", "inout", "buffer")]
    max_label = max([_text_width(port.name) for port in left + right] + [0])
    max_type = 0 if no_type else max([_text_width(port.data_type) for port in left + right] + [0])
    width = max(180, 120 + max_label * 2 + max_type * 2)
    y = 30
    parts: list[str] = []
    sections: list[tuple[float, float, float, float, str | None]] = []
    if component.generics:
        height = max(38, 22 * len(component.generics) + 16)
        sections.append((0, y, width, height, None))
        for index, port in enumerate(component.generics):
            parts.append(_text(20, y + 22 + index * 22, port.name))
        y += height
    row = 0
    port_sections: list[tuple[float, list[Port], str | None]] = []
    for group_name, ports in groups:
        rows = max(len([p for p in ports if p.direction == "in"]), len([p for p in ports if p.direction != "in"]))
        height = max(42, 22 * rows + (24 if group_name else 0) + 12)
        sections.append((0, y, width, height, group_name))
        port_sections.append((y, ports, group_name))
        if group_name:
            parts.append(_text(width / 2, y + 12, group_name, "middle", "fnt2"))
        y += height
        row += rows
    height_total = max(100, y + 30)
    for sx, sy, sw, sh, group_name in sections:
        fill = "#e8e8e8" if group_name is None else f"hsl({(sections.index((sx, sy, sw, sh, group_name)) * 77) % 360} 75% 88%)"
        stroke = "#666" if group_name is None else "#222"
        parts.insert(0, f'<rect x="{sx:g}" y="{sy:g}" width="{sw:g}" height="{sh:g}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>')
    for group_y, ports, group_name in port_sections:
        top = group_y + (24 if group_name else 0) + 18
        for index, port in enumerate([p for p in ports if p.direction == "in"]):
            py = top + index * 22
            parts.append(f'<line x1="-35" y1="{py:g}" x2="0" y2="{py:g}" stroke="#111" stroke-width="{3 if port.bus else 1}"/>')
            if port.clock:
                parts.append(f'<path d="M -35 {py-5:g} L -27 {py:g} L -35 {py+5:g}" fill="none" stroke="#111"/>')
            if port.bubble:
                parts.append(f'<circle cx="-35" cy="{py:g}" r="4" fill="white" stroke="#111"/>')
            label = port.name if no_type or not port.data_type else f"{port.name}"
            parts.append(_text(12, py, label))
            if not no_type and port.data_type:
                parts.append(_text(-43, py, port.data_type, "end", "fnt3"))
        for index, port in enumerate([p for p in ports if p.direction != "in"]):
            py = top + index * 22
            parts.append(f'<line x1="{width:g}" y1="{py:g}" x2="{width+35:g}" y2="{py:g}" stroke="#111" stroke-width="{3 if port.bus else 1}"/>')
            if port.bubble:
                parts.append(f'<circle cx="{width+35:g}" cy="{py:g}" r="4" fill="white" stroke="#111"/>')
            parts.append(_text(width - 12, py, port.name, "end"))
            if not no_type and port.data_type:
                parts.append(_text(width + 43, py, port.data_type, "start", "fnt3"))
    if title:
        if library:
            parts.append(_text(width / 2, -24, library, "middle", "fnt4"))
            parts.append(_text(width / 2, -8, component.name, "middle", "fnt4"))
        else:
            parts.append(_text(width / 2, -12, component.name, "middle", "fnt4"))
    transparent = "transparent" in options
    title_height = 40 if title and library else 25 if title else 0
    view_x, view_y = -max_type - 50, -35 if title else -10
    view_w, view_h = width + max_type * 2 + 100, height_total + title_height
    padding = float(presentation_padding)
    view_x -= padding
    view_y -= padding
    view_w += padding * 2
    view_h += padding * 2
    styles = """.fnt1 { fill:#000; font-family:Sans,sans-serif; font-size:12pt; } .fnt2 { fill:#000; font-family:Sans,sans-serif; font-size:9pt; font-weight:bold; } .fnt3 { fill:#969696; font-family:Sans,sans-serif; font-size:12pt; } .fnt4 { fill:#000; font-family:Sans,sans-serif; font-size:12pt; font-weight:bold; }"""
    background_color = presentation_background or ("" if transparent else "white")
    background = f'<rect x="{view_x:g}" y="{view_y:g}" width="{view_w:g}" height="{view_h:g}" fill="{background_color}"/>' if background_color else ""
    if title_text:
        parts.insert(0, _text(view_x + 8, view_y + 12, title_text, "start", "fnt2"))
    if description:
        parts.insert(1 if title_text else 0, _text(view_x + 8, view_y + 28, description, "start", "fnt3"))
    if presentation_frame:
        parts.append(f'<rect x="{view_x + 0.5:g}" y="{view_y + 0.5:g}" width="{max(0, view_w - 1):g}" height="{max(0, view_h - 1):g}" fill="none" stroke="#000" stroke-width="1" vector-effect="non-scaling-stroke"/>')
    svg = f'<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="{view_w*scale:g}" height="{view_h*scale:g}" viewBox="{view_x:g} {view_y:g} {view_w:g} {view_h:g}"><style>{styles}</style>{background}{"".join(parts)}</svg>'
    if len(svg.encode("utf-8")) > MAX_SVG_LENGTH:
        raise ProtocolError(413, "render_too_large", "Rendered SVG is too large.")
    return svg, "1.2.2-compatible-translation"
