import { St, Clutter, Shell, Meta } from '../gi/ext';

// Compatibility for GNOME 48+ where 'vertical' was deprecated in favor of 'orientation'
export function widgetOrientation(vertical: boolean) {
    // if orientation is supported
    if (St.BoxLayout.prototype.get_orientation !== undefined) {
        return {
            orientation: vertical
                ? Clutter.Orientation.VERTICAL
                : Clutter.Orientation.HORIZONTAL,
        };
    }

    return { vertical };
}

export function buildBlurEffect(sigma: number): Shell.BlurEffect {
    // changes in GNOME 46+
    // The sigma in Shell.BlurEffect should be replaced by radius. Since the sigma value
    // is radius / 2.0, the radius value will be sigma * 2.0.

    const effect = new Shell.BlurEffect();
    effect.set_mode(Shell.BlurMode.BACKGROUND); // blur what is behind the widget
    effect.set_brightness(1);
    if (effect.set_radius) {
        effect.set_radius(sigma * 2);
    } else {
        // @ts-expect-error "set_sigma is available in old shell versions (<= 45)"
        effect.set_sigma(sigma);
    }
    return effect;
}

export function getEventCoords(event: any): number[] {
    return event.get_coords ? event.get_coords() : [event.x, event.y]; // GNOME 40-44
}

export function maximizeWindow(window: Meta.Window): void {
    window.get_maximized
        ? window.maximize(Meta.MaximizeFlags.BOTH)
        : window.maximize();
}

export function unmaximizeWindow(window: Meta.Window): void {
    window.get_maximized
        ? window.unmaximize(Meta.MaximizeFlags.BOTH)
        : window.unmaximize();
}

export function getDefaultSeat(): Clutter.Seat {
    // GNOME 51 removed Clutter.get_default_backend() in favor of the
    // backend exposed by the stage's Clutter.Context
    if (global.stage.get_context)
        return global.stage.get_context().get_backend().get_default_seat();

    return Clutter.get_default_backend().get_default_seat();
}

export type CursorName = 'DEFAULT' | 'W_RESIZE' | 'N_RESIZE';

// GNOME 51 dropped the Meta.Cursor enum and Meta.Display.set_cursor(): cursors
// are now set per actor with Clutter.Actor.set_cursor_type(Clutter.CursorType).
// The actor's cursor is also used while it holds a grab.
export function setCursor(actor: Clutter.Actor, name: CursorName): void {
    const act = actor as any;
    if (act.set_cursor_type) {
        act.set_cursor_type((Clutter as any).CursorType[name]);
        return;
    }

    // GNOME < 51. Constants were renamed in GNOME 48 from WEST/NORTH_* to W/N_*
    const cursors = Meta.Cursor as any;
    const legacy = {
        DEFAULT: 'DEFAULT',
        W_RESIZE: 'WEST_RESIZE',
        N_RESIZE: 'NORTH_RESIZE',
    };
    global.display.set_cursor(cursors[name] ?? cursors[legacy[name]]);
}
