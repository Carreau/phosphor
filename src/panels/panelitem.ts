/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.panels {

/**
 * A concrete implementation of ILayoutItem which manages a panel.
 *
 * User code will not typically use this class directly.
 */
export
class PanelItem implements ILayoutItem {
  /**
   * Construct a new panel item.
   */
  constructor(panel: Panel) {
    this._panel = panel;
  }

  /**
   * Test whether the item manages a panel.
   */
  get isPanel(): boolean {
    return true;
  }

  /**
   * Test whether the item manages empty space.
   */
  get isSpacer(): boolean {
    return false;
  }

  /**
   * Test whether the item should be treated as hidden.
   */
  get isHidden(): boolean {
    return this._panel.isHidden;
  }

  /**
   * The panel the item manages, if any.
   */
  get panel(): Panel {
    return this._panel;
  }

  /**
   * Test whether the item should be expanded horizontally.
   */
  get expandHorizontal(): boolean {
    if (this._panel.alignment & Alignment.Horizontal_Mask) {
      return false;
    }
    var hPolicy = this._panel.horizontalSizePolicy;
    return (hPolicy & SizePolicy.ExpandFlag) !== 0;
  }

  /**
   * Test Whether the item should be expanded vertically.
   */
  get expandVertical(): boolean {
    if (this._panel.alignment & Alignment.Vertical_Mask) {
      return false;
    }
    var vPolicy = this._panel.verticalSizePolicy;
    return (vPolicy & SizePolicy.ExpandFlag) !== 0;
  }

  /**
   * The horizontal stretch factor for the item.
   */
  get horizontalStretch(): number {
    return this._panel.horizontalStretch;
  }

  /**
   * The vertical stretch factor for the item.
   */
  get verticalStretch(): number {
    return this._panel.verticalStretch;
  }

  /**
   * Invalidate the cached data for the item.
   */
  invalidate(): void {
    this._origHint = null;
    this._sizeHint = null;
    this._minSize = null;
    this._maxSize = null;
  }

  /**
   * Compute the preferred size of the item.
   */
  sizeHint(): Size {
    if (!this._sizeHint) {
      this._updateSizes();
    }
    return this._sizeHint;
  }

  /**
   * Compute the minimum size of the item.
   */
  minSize(): Size {
    if (!this._minSize) {
      this._updateSizes();
    }
    return this._minSize;
  }

  /**
   * Compute the maximum size of the item.
   */
  maxSize(): Size {
    if (!this._maxSize) {
      this._updateSizes();
    }
    return this._maxSize;
  }

  /**
   * Set the geometry of the item.
   */
  setGeometry(x: number, y: number, width: number, height: number): void {
    var panel = this._panel;
    if (panel.isHidden) {
      return;
    }
    var w = width;
    var h = height;
    var alignment = panel.alignment;
    if (alignment & Alignment.Horizontal_Mask) {
      var igW = panel.horizontalSizePolicy === SizePolicy.Ignored;
      w = Math.min(w, igW ? this._origHint.width : this._sizeHint.width);
    }
    if (alignment & Alignment.Vertical_Mask) {
      var igH = panel.verticalSizePolicy === SizePolicy.Ignored;
      h = Math.min(h, igH ? this._origHint.height : this._sizeHint.height);
    }
    var minSize = this._minSize;
    var maxSize = this._maxSize;
    var w = Math.max(minSize.width, Math.min(w, maxSize.width));
    var h = Math.max(minSize.height, Math.min(h, maxSize.height));
    if (alignment & Alignment.Right) {
      x += width - w;
    } else if (alignment & Alignment.HorizontalCenter) {
      x += (width - w) / 2;
    }
    if (alignment & Alignment.Bottom) {
      y += height - h;
    } else if (alignment & Alignment.VerticalCenter) {
      y += (height - h) / 2;
    }
    panel.setGeometry(x, y, w, h);
  }

  /**
   * Update the computed sizes for the panel item.
   */
  private _updateSizes(): void {
    var panel = this._panel;
    if (panel.isHidden) {
      var zero = new Size(0, 0);
      this._origHint = zero;
      this._sizeHint = zero;
      this._minSize = zero;
      this._maxSize = zero;
      return;
    }
    var min = panel.minSize;
    var max = panel.maxSize;
    var sHint = panel.sizeHint();
    var mHint = panel.minSizeHint();
    var xHint = panel.maxSizeHint();
    var vsp = panel.verticalSizePolicy;
    var hsp = panel.horizontalSizePolicy;
    var al = panel.alignment;
    this._origHint = sHint;
    this._sizeHint = makeSizeHint(sHint, mHint, min, max, hsp, vsp);
    this._minSize = makeMinSize(sHint, mHint, min, max, hsp, vsp);
    this._maxSize = makeMaxSize(sHint, mHint, xHint, min, max, hsp, vsp, al);
  }

  private _panel: Panel;
  private _origHint: Size = null;
  private _sizeHint: Size = null;
  private _minSize: Size = null;
  private _maxSize: Size = null;
}


/**
 * Make the effective size hint for the given sizing values.
 */
function makeSizeHint(
  sizeHint: Size,
  minHint: Size,
  minSize: Size,
  maxSize: Size,
  hPolicy: SizePolicy,
  vPolicy: SizePolicy): Size {
  var w = 0;
  var h = 0;
  if (hPolicy !== SizePolicy.Ignored) {
    w = Math.max(minHint.width, sizeHint.width);
  }
  if (vPolicy !== SizePolicy.Ignored) {
    h = Math.max(minHint.height, sizeHint.height);
  }
  w = Math.max(minSize.width, Math.min(w, maxSize.width));
  h = Math.max(minSize.height, Math.min(h, maxSize.height));
  return new Size(w, h);
}


/**
 * Make the effective minimum size for the given sizing values.
 */
function makeMinSize(
  sizeHint: Size,
  minHint: Size,
  minSize: Size,
  maxSize: Size,
  hPolicy: SizePolicy,
  vPolicy: SizePolicy): Size {
  var w = 0;
  var h = 0;
  if (hPolicy !== SizePolicy.Ignored) {
    if (hPolicy & SizePolicy.ShrinkFlag) {
      w = minHint.width;
    } else {
      w = Math.max(minHint.width, sizeHint.width);
    }
  }
  if (vPolicy !== SizePolicy.Ignored) {
    if (vPolicy & SizePolicy.ShrinkFlag) {
      h = minHint.height;
    } else {
      h = Math.max(minHint.height, sizeHint.height);
    }
  }
  w = Math.max(minSize.width, Math.min(w, maxSize.width));
  h = Math.max(minSize.height, Math.min(h, maxSize.height));
  return new Size(w, h);
}


/**
 * Make the effective maximum size for the given sizing values.
 */
function makeMaxSize(
  sizeHint: Size,
  minHint: Size,
  maxHint: Size,
  minSize: Size,
  maxSize: Size,
  hPolicy: SizePolicy,
  vPolicy: SizePolicy,
  alignment: Alignment): Size {
  var w = Infinity;
  var h = Infinity;
  if ((alignment & Alignment.Horizontal_Mask) === 0) {
    if (hPolicy !== SizePolicy.Ignored) {
      if (hPolicy & SizePolicy.GrowFlag) {
        w = Math.max(minHint.width, maxHint.width);
      } else {
        w = Math.max(minHint.width, sizeHint.width);
      }
    }
    w = Math.max(minSize.width, Math.min(w, maxSize.width));
  }
  if ((alignment & Alignment.Vertical_Mask) === 0) {
    if (vPolicy !== SizePolicy.Ignored) {
      if (vPolicy & SizePolicy.GrowFlag) {
        h = Math.max(minHint.height, maxHint.height);
      } else {
        h = Math.max(minHint.height, sizeHint.height);
      }
    }
    h = Math.max(minSize.height, Math.min(h, maxSize.height));
  }
  return new Size(w, h);
}

} // module phosphor.panels
