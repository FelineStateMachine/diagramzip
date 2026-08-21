package svg

// This local vendored adaptation keeps the upstream iteration order but uses
// slices instead of goroutine-backed channels. TinyGo's no-scheduler target is
// required for a precompiled Workers module; the upstream channel iterators
// otherwise make the module import a scheduler host.
type CanvasIterator func(width int, height int) []XyIndex

func UpDownMinor(width int, height int) []XyIndex {
	c := make([]XyIndex, 0, width*height)
	for w := 0; w < width; w++ {
		for h := 0; h < height; h++ {
			c = append(c, XyIndex{w, h})
		}
	}
	return c
}

func LeftRightMinor(width int, height int) []XyIndex {
	c := make([]XyIndex, 0, width*height)
	for h := 0; h < height; h++ {
		for w := 0; w < width; w++ {
			c = append(c, XyIndex{w, h})
		}
	}
	return c
}

func DiagDown(width int, height int) []XyIndex {
	c := make([]XyIndex, 0, width*height)
	minSum := -height + 1
	maxSum := width

	for sum := minSum; sum <= maxSum; sum++ {
		for w := 0; w < width; w++ {
			for h := 0; h < height; h++ {
				if w-h == sum {
					c = append(c, XyIndex{w, h})
				}
			}
		}
	}
	return c
}

func DiagUp(width int, height int) []XyIndex {
	c := make([]XyIndex, 0, width*height)
	maxSum := width + height - 2

	for sum := 0; sum <= maxSum; sum++ {
		for w := 0; w < width; w++ {
			for h := 0; h < height; h++ {
				if h+w == sum {
					c = append(c, XyIndex{w, h})
				}
			}
		}
	}
	return c
}
