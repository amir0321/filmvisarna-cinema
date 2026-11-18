import { useEffect, useRef } from "react";
import { useTranslation } from "../context/LocaleContext";
import { getYouTubeEmbedUrl } from "../utils/movie";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerUrl: string;
  movieTitle: string;
}

export default function TrailerModal({
  isOpen,
  onClose,
  trailerUrl,
  movieTitle,
}: TrailerModalProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const embedUrl = getYouTubeEmbedUrl(trailerUrl);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="trailer-modal"
      aria-labelledby="trailer-modal-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="trailer-modal__content">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h2 id="trailer-modal-title" className="h6 mb-0 text-body">
            {t("trailer.heading", { title: movieTitle })}
          </h2>
          <button
            type="button"
            className="btn-close"
            aria-label={t("trailer.close")}
            onClick={onClose}
          />
        </div>

        {/* Unmount the video so it stops playing */}
        {isOpen &&
          (embedUrl ? (
            <div className="ratio ratio-16x9 rounded-3 overflow-hidden bg-black">
              <iframe
                src={embedUrl}
                title={t("trailer.iframeTitle", { title: movieTitle })}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="text-body mb-0">
              {t("trailer.unavailable")}{" "}
              <a
                href={trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-danger"
              >
                {t("trailer.openInNewTab")}
              </a>
            </p>
          ))}
      </div>
    </dialog>
  );
}
