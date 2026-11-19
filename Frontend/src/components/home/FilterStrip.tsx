import { useCallback, useRef, useState } from "react";
import { useTranslation } from "../../context/LocaleContext";
import type { ScreeningWhen } from "../../types";
import {
  formatDateLong,
  formatDateShort,
} from "../../utils/date";
import DatePickerPopover from "../DatePickerPopover";
import type { AgeFilter, DateFilter } from '../../utils/movieFilters';
import { hasDateFilterScreenings } from '../../utils/movieFilters';
import type { ScreeningProgramme } from '../../hooks/useScreeningProgramme';

export type { AgeFilter, DateFilter } from '../../utils/movieFilters';

interface FilterStripProps {
  programme: ScreeningProgramme;
  dateFilter: DateFilter;
  ageFilter: AgeFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  onAgeFilterChange: (filter: AgeFilter) => void;
}

const DATE_PRESETS = [
  { when: "today", labelKey: "date.today" },
  { when: "tomorrow", labelKey: "date.tomorrow" },
  { when: "weekend", labelKey: "date.weekend" },
] as const satisfies readonly { when: ScreeningWhen; labelKey: string }[];

const AGE_VALUES: AgeFilter[] = [null, 0, 7, 11, 15];

function pillClassName(isActive: boolean): string {
  return `filter-pill${isActive ? " filter-pill--active" : ""}`;
}

export default function FilterStrip({
  programme,
  dateFilter,
  ageFilter,
  onDateFilterChange,
  onAgeFilterChange,
}: FilterStripProps) {
  const { t, locale } = useTranslation();
  const datePickerButtonRef = useRef<HTMLButtonElement>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const closeDatePicker = useCallback(() => setIsDatePickerOpen(false), []);
  const customDate = dateFilter.kind === "date" ? dateFilter.date : null;

  return (
    <div className="filter-strip">
      <div className="container home-container d-flex flex-column flex-md-row flex-md-wrap gap-2 gap-md-4 py-3">
        <div
          role="group"
          aria-labelledby="date-filter-label"
          className="filter-strip__group"
        >
          <span id="date-filter-label" className="filter-strip__label">
            {t("filter.date")}
          </span>
          {DATE_PRESETS.map((preset) => {
            const isActive =
              dateFilter.kind === "preset" && dateFilter.when === preset.when;
            const disabled = programme.loading || Boolean(programme.error) || !hasDateFilterScreenings({ kind: 'preset', when: preset.when }, programme.today, programme.dates);
            return (
              <button
                key={preset.when}
                type="button"
                className={pillClassName(isActive)}
                aria-pressed={isActive}
                disabled={disabled}
                onClick={() =>
                  onDateFilterChange({ kind: "preset", when: preset.when })
                }
              >
                {isActive && (
                  <i className="bi bi-check2 me-1" aria-hidden="true"></i>
                )}
                {t(preset.labelKey)}
              </button>
            );
          })}

          <button
            ref={datePickerButtonRef}
            type="button"
            className={pillClassName(customDate !== null)}
            aria-pressed={customDate !== null}
            aria-haspopup="dialog"
            aria-expanded={isDatePickerOpen}
            aria-controls={isDatePickerOpen ? "date-picker-popover" : undefined}
            aria-label={
              customDate
                ? t("filter.selectedDateChange", { date: formatDateLong(customDate, locale) })
                : t("calendar.chooseDate")
            }
            onClick={() => setIsDatePickerOpen((isOpen) => !isOpen)}
          >
            <i className="bi bi-calendar3" aria-hidden="true"></i>
            {customDate && (
              <span className="ms-2">{formatDateShort(customDate, locale)}</span>
            )}
          </button>
          {isDatePickerOpen && (
            <DatePickerPopover
              id="date-picker-popover"
              anchorRef={datePickerButtonRef}
              selectedDate={customDate}
              minDate={programme.today}
              maxDate={programme.maxDate}
              programme={programme}
              onSelect={(date) => onDateFilterChange({ kind: "date", date })}
              onClose={closeDatePicker}
            />
          )}
        </div>

        <span
          className="filter-strip__divider d-none d-md-block"
          aria-hidden="true"
        ></span>

        <div
          role="group"
          aria-labelledby="age-filter-label"
          className="filter-strip__group"
        >
          <span id="age-filter-label" className="filter-strip__label">
            {t("filter.ageLimit")}
          </span>
          {AGE_VALUES.map((value) => {
            const isActive = ageFilter === value;
            const label = value === null
              ? t("common.all")
              : value === 0
                ? t("movie.allAges")
                : t("movie.age", { age: value });
            return (
              <button
                key={String(value)}
                type="button"
                className={pillClassName(isActive)}
                aria-pressed={isActive}
                onClick={() => onAgeFilterChange(value)}
              >
                {isActive && (
                  <i className="bi bi-check2 me-1" aria-hidden="true"></i>
                )}
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
