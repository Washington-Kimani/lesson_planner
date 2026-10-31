"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

/** Mount it to open it, unmount it to close it. Uses a native <dialog>, so focus trapping and Esc come for free. */
export function Modal({ title, onClose, wide, children }: {
    title: string;
    onClose: () => void;
    wide?: boolean;
    children: React.ReactNode;
}) {
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = ref.current;
        if (dialog && !dialog.open) dialog.showModal();
        return () => dialog?.close();
    }, []);

    return (
        <dialog
            ref={ref}
            className="modal"
            data-wide={wide ? "true" : "false"}
            aria-label={title}
            onCancel={(event) => { event.preventDefault(); onClose(); }}
            onClick={(event) => { if (event.target === ref.current) onClose(); }}
        >
            <div className="modal-head">
                <h2>{title}</h2>
                <button type="button" className="icon-button" aria-label="Close" onClick={onClose}><X size={16} /></button>
            </div>
            <div className="modal-body">{children}</div>
        </dialog>
    );
}
