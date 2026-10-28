import { useEffect, useRef } from "react";
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
          <h2 id="trailer-modal-title" className="h6 mb-0 text-light">
            Trailer: {movieTitle}
          </h2>
          <button
            type="button"
            className="btn-close btn-close-white"
            aria-label="Stäng trailer"
            onClick={onClose}
          />
        </div>

        {/* Unmount the video so it stops playing */}
        {isOpen &&
          (embedUrl ? (
            <div className="ratio ratio-16x9 rounded-3 overflow-hidden bg-black">
              <iframe
                src={embedUrl}
                title={`Trailer för ${movieTitle}`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="text-light mb-0">
              Trailern kan inte visas här.{" "}
              <a
                href={trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-danger"
              >
                Öppna trailern i en ny flik
              </a>
            </p>
          ))}
      </div>
    </dialog>
  );
}
