use svgbob::{to_svg_with_settings, Settings};
use wasm_bindgen::prelude::*;

/// Render one ASCII source using svgbob's pure library API.
///
/// The JavaScript adapter validates bounds and option syntax. Keeping this
/// wrapper free of DOM, filesystem, and network APIs makes it usable in a
/// Cloudflare Worker compiled-Wasm binding.
#[wasm_bindgen]
pub fn render(
    source: &str,
    background: &str,
    fill_color: &str,
    font_family: &str,
    font_size: u32,
    scale: f32,
    stroke_width: f32,
) -> String {
    let mut settings = Settings::default();
    settings.background = background.to_owned();
    settings.fill_color = fill_color.to_owned();
    settings.font_family = font_family.to_owned();
    settings.font_size = font_size as usize;
    // Kroki's `scale` is a multiplier over Svgbob's default scale (8.0).
    settings.scale = 8.0 * scale;
    settings.stroke_width = stroke_width;
    to_svg_with_settings(source, &settings)
}
