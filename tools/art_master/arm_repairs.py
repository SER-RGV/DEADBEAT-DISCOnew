#!/usr/bin/env python3
"""Hand-placed arm repairs for the outfit masters (see retouch_outfit_arms.py).

Each repair paints a clean rolled sleeve/cuff over torn garment geometry and
erases stray shards, using tones sampled from the intact part of the same
garment. Coordinates refer to the 768x1365 masters.
"""
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

def soft_poly_mask(size, polys, ss=4):
    """Anti-aliased mask (0..1) for polygons; polys = list of point lists."""
    w, h = size
    im = Image.new('L', (w * ss, h * ss), 0)
    d = ImageDraw.Draw(im)
    for pts in polys:
        d.polygon([(x * ss, y * ss) for x, y in pts], fill=255)
    return np.asarray(im.resize((w, h), Image.Resampling.LANCZOS)).astype(np.float32) / 255.0

def soft_line_mask(size, pts, width, ss=4):
    w, h = size
    im = Image.new('L', (w * ss, h * ss), 0)
    d = ImageDraw.Draw(im)
    d.line([(x * ss, y * ss) for x, y in pts], fill=255, width=int(width * ss), joint='curve')
    return np.asarray(im.resize((w, h), Image.Resampling.LANCZOS)).astype(np.float32) / 255.0

def sample_tone(arr, box):
    x0, y0, x1, y1 = box
    reg = arr[y0:y1, x0:x1].reshape(-1, 3).astype(np.float32)
    return np.median(reg, axis=0)

def paint_sleeve(arr, poly, cuff, sample_box, shadow=None, shade=0.87, outline_pts=None):
    """Clean sleeve with dark ink outline, inner shadow and a rolled cuff.

    outline_pts: open polyline to ink (the outer silhouette); the seam that
    meets the intact garment is left unstroked so no artificial line appears.
    """
    base = sample_tone(arr, sample_box)
    dark = np.clip(base * 0.34, 0, 255)
    size = (arr.shape[1], arr.shape[0])
    m = soft_poly_mask(size, [poly])
    arr[:] = (arr * (1 - m[..., None]) + base * m[..., None]).astype(arr.dtype)
    if shadow:
        ms = soft_poly_mask(size, [shadow])
        arr[:] = (arr * (1 - ms[..., None]) + np.clip(base * shade, 0, 255) * ms[..., None]).astype(arr.dtype)
    mc = soft_poly_mask(size, [cuff])
    arr[:] = (arr * (1 - mc[..., None]) + np.clip(base * 0.97, 0, 255) * mc[..., None]).astype(arr.dtype)
    # rolled cuff fold: mid line across the band + slight darkening at its top edge
    fold = [cuff[0], cuff[1]] if len(cuff) == 2 else [(cuff[0][0] * 0.5 + cuff[3][0] * 0.5, cuff[0][1] * 0.5 + cuff[3][1] * 0.5),
                                                      (cuff[1][0] * 0.5 + cuff[2][0] * 0.5, cuff[1][1] * 0.5 + cuff[2][1] * 0.5)]
    mf = soft_line_mask(size, fold, 2.0)
    arr[:] = (arr * (1 - mf[..., None]) + np.clip(base * 0.78, 0, 255) * mf[..., None]).astype(arr.dtype)
    # ink outline along the open sleeve silhouette + the cuff band
    me = soft_line_mask(size, outline_pts if outline_pts else poly + [poly[0]], 2.2)
    me = np.clip(me + soft_line_mask(size, cuff + [cuff[0]], 2.2), 0, 1)
    arr[:] = (arr * (1 - me[..., None]) + dark * me[..., None]).astype(arr.dtype)
    return arr

def bg_fill(arr, poly):
    bg = np.median(np.concatenate((arr[:12].reshape(-1, 3), arr[-12:].reshape(-1, 3),
                                   arr[:, :12].reshape(-1, 3), arr[:, -12:].reshape(-1, 3))), axis=0)
    m = soft_poly_mask((arr.shape[1], arr.shape[0]), [poly])
    arr[:] = (arr * (1 - m[..., None]) + bg * m[..., None]).astype(arr.dtype)
    return arr

def inpaint_light(arr, box, tol=48):
    """Replace torn-fabric pixels (light/low-saturation) inside box by the
    nearest other color, preserving skin/tattoo art beneath."""
    x0, y0, x1, y1 = box
    reg = arr[y0:y1, x0:x1].astype(np.float32)
    mx = reg.max(axis=2); mn = reg.min(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1e-3)
    frag = (mx > 140) & (sat < 0.22)
    if not frag.any() or frag.all():
        return arr
    good = ~frag
    _, (iy, ix) = ndimage.distance_transform_edt(~good, return_indices=True)
    filled = reg[iy, ix]
    reg = np.where(frag[..., None], filled, reg)
    arr[y0:y1, x0:x1] = np.clip(reg, 0, 255).astype(arr.dtype)
    return arr

def inpaint_dark(arr, box, thresh=60):
    """Replace near-black torn shards inside box by the nearest other color."""
    x0, y0, x1, y1 = box
    reg = arr[y0:y1, x0:x1].astype(np.float32)
    frag = reg.max(axis=2) < thresh
    if not frag.any() or frag.all():
        return arr
    good = ~frag
    _, (iy, ix) = ndimage.distance_transform_edt(~good, return_indices=True)
    filled = reg[iy, ix]
    reg = np.where(frag[..., None], filled, reg)
    arr[y0:y1, x0:x1] = np.clip(reg, 0, 255).astype(arr.dtype)
    return arr

def paint_flat(arr, poly, sample_box, tone=1.0):
    """Fill a polygon with a flat sampled tone (skin patches, garment fills)."""
    base = np.clip(sample_tone(arr, sample_box) * tone, 0, 255)
    m = soft_poly_mask((arr.shape[1], arr.shape[0]), [poly])
    arr[:] = (arr * (1 - m[..., None]) + base * m[..., None]).astype(arr.dtype)
    return arr

CHEF_IDLE_L = dict(
    sleeve=[(30, 262), (112, 258), (120, 300), (124, 352), (126, 398), (122, 428), (62, 432), (54, 392), (46, 340), (36, 300)],
    outline=[(112, 258), (120, 300), (124, 352), (126, 398), (122, 428), (62, 432), (54, 392), (46, 340), (36, 300), (30, 262)],
    cuff=[(57, 398), (125, 394), (123, 428), (59, 432)],
    shadow=[(104, 262), (112, 258), (120, 300), (124, 352), (126, 398), (122, 428), (106, 430), (104, 380), (102, 320)],
    sample=(45, 275, 95, 300),
    erase=[[(8, 462), (72, 462), (76, 505), (86, 535), (88, 585), (85, 645), (55, 660), (28, 640), (15, 600), (8, 540)]],
    inpaint=(40, 435, 112, 545),
    inpaint_dark=(70, 460, 110, 545),
    inpaint2=(80, 515, 118, 605),
    skin_edge=[[(75, 455), (80, 500), (86, 522), (89, 545), (79, 545), (74, 522), (69, 500), (65, 455)], (95, 470, 120, 530)],
)

CHEF_IDLE_R = dict(
    sleeve=[(437, 260), (533, 256), (538, 300), (538, 352), (534, 382), (452, 390), (444, 355), (447, 300)],
    outline=[(533, 256), (538, 300), (538, 352), (534, 382), (452, 390), (444, 355), (447, 300), (437, 260)],
    cuff=[(452, 372), (536, 368), (534, 406), (458, 410)],
    shadow=[(512, 258), (533, 256), (538, 300), (538, 352), (534, 382), (512, 386)],
    sample=(460, 275, 520, 305),
    erase=[],
    inpaint=(430, 360, 545, 430),
)

REPAIRS = {
    'cocinero_idle': [CHEF_IDLE_L, CHEF_IDLE_R],
    'cocinero_walk': [CHEF_IDLE_L, CHEF_IDLE_R],
    'cocinero_aim': [
        dict(  # rear arm: torn sleeve end near the elbow
            sleeve=[(210, 348), (240, 350), (266, 364), (266, 410), (238, 428), (208, 428)],
            outline=[(240, 350), (266, 364), (266, 410), (238, 428), (208, 428)],
            cuff=[(238, 352), (268, 362), (268, 412), (238, 426)],
            shadow=[(210, 412), (238, 428), (208, 428)],
            sample=(165, 365, 205, 410),
            erase=[[(215, 392), (252, 392), (258, 422), (246, 434), (212, 430)]],
            inpaint=(215, 432, 275, 435),
        ),
        dict(  # forward arm: torn sleeve end mid-forearm
            sleeve=[(622, 306), (658, 310), (684, 326), (682, 354), (652, 368), (618, 362)],
            outline=[(658, 310), (684, 326), (682, 354), (652, 368), (618, 362)],
            cuff=[(652, 312), (688, 324), (684, 358), (650, 364)],
            shadow=[(622, 352), (652, 368), (618, 362)],
            sample=(560, 330, 615, 355),
            erase=[[(642, 372), (702, 368), (712, 378), (700, 395), (650, 395), (635, 382)]],
            inpaint_dark=(655, 335, 715, 382),
        ),
    ],
    'cocinero_hurt': [
        dict(  # left arm: shard on the sleeve, ragged right edge
            sleeve=[(220, 278), (298, 280), (330, 300), (322, 330), (322, 362), (326, 424), (220, 424)],
            outline=[(298, 280), (330, 300), (322, 330), (322, 362), (326, 424)],
            cuff=[(224, 280), (300, 282), (310, 312), (226, 316)],
            shadow=[(302, 282), (330, 300), (322, 330), (322, 362), (326, 424), (306, 424)],
            sample=(235, 330, 290, 390),
            inpaint_dark=(300, 278, 348, 332),
        ),
        dict(  # right arm: ragged left edge, shards, torn piece below
            sleeve=[(500, 312), (568, 308), (588, 332), (594, 392), (586, 438), (508, 440), (488, 410), (490, 352)],
            outline=[(568, 308), (588, 332), (594, 392), (586, 438), (508, 440), (488, 410), (490, 352), (500, 312)],
            cuff=[(498, 308), (572, 304), (576, 338), (500, 342)],
            shadow=[(560, 310), (588, 332), (594, 392), (586, 438), (562, 440)],
            sample=(520, 350, 575, 410),
            erase=[[(582, 412), (620, 406), (628, 450), (600, 458), (586, 448)]],
        ),
    ],
    'cocinero_roll': [
        dict(  # extended arm: ragged shoulder edge, floating cuff fragment
            sleeve=[(320, 330), (415, 328), (420, 395), (414, 455), (330, 458), (316, 395)],
            outline=[(415, 328), (420, 395), (414, 455), (330, 458), (316, 395), (320, 330)],
            cuff=[(328, 430), (416, 426), (412, 458), (332, 462)],
            shadow=[(395, 330), (420, 395), (414, 455), (392, 456)],
            sample=(340, 350, 405, 420),
            erase=[[(278, 368), (332, 362), (338, 428), (316, 438), (276, 422)]],
        ),
        dict(  # tucked arm: ragged left edge with shard
            sleeve=[(548, 348), (625, 350), (630, 410), (622, 455), (552, 458), (522, 418), (526, 368)],
            outline=[(548, 348), (625, 350), (630, 410), (622, 455), (552, 458), (522, 418), (526, 368)],
            cuff=[(524, 358), (572, 342), (596, 372), (544, 392)],
            shadow=[(600, 350), (630, 410), (622, 455), (592, 456)],
            sample=(560, 385, 620, 435),
        ),
    ],
    'cocinero_death': [
        dict(  # shard over the sleeve at the elbow junction
            patch=[(292, 296), (352, 296), (358, 330), (336, 346), (298, 340)],
            sample=(370, 315, 430, 345),
            edge=[(332, 306), (320, 320), (306, 340)],
        ),
    ],
    'pintor_idle': [
        dict(  # left arm: gray contamination on the cuff, floating fragment
            erase=[[(32, 388), (88, 382), (92, 452), (80, 460), (30, 450)]],
            patch=[(68, 342), (132, 348), (140, 395), (128, 415), (85, 418), (72, 392)],
            sample=(85, 350, 120, 375),
            edge=[[(78, 362), (118, 368)], [(85, 418), (128, 415)], [(132, 348), (140, 395), (128, 415)]],
            inpaint=(80, 385, 125, 465),
        ),
        dict(  # right arm: ragged biceps cut, gray bits, shard on the forearm
            sleeve=[(428, 262), (533, 258), (538, 300), (540, 340), (536, 380), (478, 386), (452, 368), (438, 330), (432, 290)],
            outline=[(533, 258), (538, 300), (540, 340), (536, 380), (478, 386), (452, 368), (438, 330), (432, 290)],
            cuff=[(472, 358), (540, 352), (538, 390), (480, 394)],
            shadow=[(512, 260), (533, 258), (538, 300), (540, 340), (536, 380), (512, 384)],
            sample=(460, 275, 520, 305),
            erase=[[(428, 350), (462, 342), (476, 384), (462, 398), (432, 392)],
                   [(448, 382), (505, 378), (515, 432), (495, 445), (448, 438)]],
            inpaint=(465, 385, 530, 448),
        ),
    ],
    'pintor_walk': [
        dict(  # left arm: gray contamination on the cuff, floating fragment
            erase=[[(32, 388), (88, 382), (92, 452), (80, 460), (30, 450)]],
            patch=[(68, 342), (132, 348), (140, 395), (128, 415), (85, 418), (72, 392)],
            sample=(85, 350, 120, 375),
            edge=[[(78, 362), (118, 368)], [(85, 418), (128, 415)], [(132, 348), (140, 395), (128, 415)]],
            inpaint=(80, 385, 125, 465),
        ),
        dict(  # right arm: ragged biceps cut, gray bits, shard on the forearm
            sleeve=[(428, 262), (533, 258), (538, 300), (540, 340), (536, 380), (478, 386), (452, 368), (438, 330), (432, 290)],
            outline=[(533, 258), (538, 300), (540, 340), (536, 380), (478, 386), (452, 368), (438, 330), (432, 290)],
            cuff=[(472, 358), (540, 352), (538, 390), (480, 394)],
            shadow=[(512, 260), (533, 258), (538, 300), (540, 340), (536, 380), (512, 384)],
            sample=(460, 275, 520, 305),
            erase=[[(428, 350), (462, 342), (476, 384), (462, 398), (432, 392)],
                   [(448, 382), (505, 378), (515, 432), (495, 445), (448, 438)]],
            inpaint=(465, 385, 530, 448),
        ),
    ],
    'pintor_aim': [
        dict(  # rear arm: dark shard over the cuff, gray shard below
            erase=[[(218, 446), (252, 442), (258, 480), (240, 492), (215, 482)]],
            patch=[(248, 372), (300, 378), (306, 430), (292, 455), (250, 458)],
            sample=(235, 370, 265, 440),
            edge=[[(262, 362), (266, 452)], [(288, 362), (300, 385), (306, 430), (292, 455)]],
        ),
        dict(  # forward arm: torn sleeve end mid-forearm with shards
            sleeve=[(600, 282), (650, 280), (682, 300), (688, 345), (672, 372), (618, 375)],
            outline=[(650, 280), (682, 300), (688, 345), (672, 372), (618, 375)],
            cuff=[(652, 284), (692, 300), (688, 352), (655, 368)],
            shadow=[(618, 356), (672, 372), (618, 375)],
            sample=(560, 310, 615, 355),
            erase=[[(628, 382), (678, 378), (686, 404), (662, 418), (626, 408)]],
            inpaint_dark=(630, 295, 700, 380),
        ),
    ],
    'pintor_hurt': [
        dict(  # left arm: ragged right edge with gray shard
            sleeve=[(330, 332), (388, 330), (412, 352), (414, 388), (396, 404), (332, 402)],
            outline=[(388, 330), (412, 352), (414, 388), (396, 404)],
            cuff=[(332, 330), (388, 328), (396, 352), (336, 356)],
            shadow=[(388, 330), (412, 352), (414, 388), (396, 404), (382, 402)],
            sample=(340, 360, 380, 395),
            inpaint_dark=(370, 335, 430, 395),
        ),
        dict(  # right arm: ragged mass with shards
            sleeve=[(478, 348), (540, 342), (580, 362), (612, 398), (608, 442), (548, 458), (498, 442), (472, 398)],
            outline=[(540, 342), (580, 362), (612, 398), (608, 442), (548, 458), (498, 442), (472, 398), (478, 348)],
            cuff=[(474, 348), (534, 340), (548, 372), (484, 382)],
            shadow=[(560, 352), (612, 398), (608, 442), (568, 452)],
            sample=(500, 380, 560, 430),
            erase=[[(455, 360), (480, 355), (486, 420), (470, 432), (452, 415)]],
            inpaint_dark=(515, 338, 570, 385),
        ),
    ],
    'pintor_roll': [
        dict(  # extended arm: ragged top edge, floating cuff fragment
            sleeve=[(332, 340), (430, 338), (436, 405), (428, 468), (342, 472), (326, 405)],
            outline=[(430, 338), (436, 405), (428, 468), (342, 472), (326, 405), (332, 340)],
            cuff=[(340, 442), (430, 438), (426, 472), (346, 476)],
            shadow=[(408, 340), (436, 405), (428, 468), (404, 470)],
            sample=(350, 360, 415, 430),
            erase=[[(282, 378), (338, 372), (344, 438), (322, 448), (280, 432)]],
        ),
        dict(  # tucked arm: ragged left edge with big shard
            sleeve=[(558, 352), (638, 354), (644, 415), (636, 458), (566, 462), (528, 428), (522, 378), (534, 360)],
            outline=[(558, 352), (638, 354), (644, 415), (636, 458), (566, 462), (528, 428), (522, 378), (534, 360)],
            cuff=[(538, 362), (586, 346), (610, 376), (558, 396)],
            shadow=[(612, 354), (644, 415), (636, 458), (606, 460)],
            sample=(572, 388, 632, 438),
        ),
    ],
    'pintor_death': [
        dict(  # shard over the sleeve's top edge at the elbow junction
            patch=[(352, 312), (448, 310), (455, 338), (430, 358), (368, 362), (348, 344)],
            sample=(390, 365, 450, 395),
            edge=[[(348, 338), (382, 318), (450, 312)]],
        ),
    ],
}

def apply_repair(arr, rep):
    for poly in rep.get('erase', []):
        arr = bg_fill(arr, poly)
    if rep.get('patch'):
        arr = paint_flat(arr, rep['patch'], rep['sample'])
    if rep.get('edge'):
        edges = rep['edge']
        if edges and isinstance(edges[0][0], (int, float)):
            edges = [edges]
        for pts in edges:
            m = soft_line_mask((arr.shape[1], arr.shape[0]), pts, 2.2)
            arr[:] = (arr * (1 - m[..., None]) + 40 * m[..., None]).astype(arr.dtype)
    if 'sleeve' in rep:
        arr = paint_sleeve(arr, rep['sleeve'], rep['cuff'], rep['sample'], rep.get('shadow'), outline_pts=rep.get('outline'))
    if rep.get('inpaint'):
        arr = inpaint_light(arr, rep['inpaint'])
    if rep.get('inpaint2'):
        arr = inpaint_light(arr, rep['inpaint2'])
    if rep.get('inpaint_dark'):
        arr = inpaint_dark(arr, rep['inpaint_dark'])
    if rep.get('skin_edge'):
        poly, box = rep['skin_edge']
        arr = paint_flat(arr, poly, box, tone=0.98)
    return arr
