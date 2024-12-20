import type { GanttBarObject } from "../types";
import type { TimeUnit } from "../types";
import useDayjsHelper from "./useDayjsHelper";
import provideConfig from "../provider/provideConfig";

export function useRowDates() {
  const { toDayjs } = useDayjsHelper();
  const { barStart, barEnd, precision } = provideConfig();

  const getEarliestStartDate = (bars: GanttBarObject[]): string => {
    if (!bars.length) return '';
    return bars.reduce((min: string, bar: GanttBarObject) => {
      const currentStart = bar[barStart.value];
      return !min || toDayjs(currentStart).isBefore(toDayjs(min)) 
        ? currentStart 
        : min;
    }, '');
  };

  const getLatestEndDate = (bars: GanttBarObject[]): string => {
    if (!bars.length) return '';
    return bars.reduce((max: string, bar: GanttBarObject) => {
      const currentEnd = bar[barEnd.value];
      return !max || toDayjs(currentEnd).isAfter(toDayjs(max)) 
        ? currentEnd 
        : max;
    }, '');
  };

  const calculateDuration = (bars: GanttBarObject[]): number => {
    if (!bars.length) return 0;
    const start = getEarliestStartDate(bars);
    const end = getLatestEndDate(bars);
    return toDayjs(end).diff(toDayjs(start), precision.value as TimeUnit);
  };

  const formatDuration = (duration: number): string => {
    switch (precision.value) {
      case 'hour':
        return `${duration}h`;
      case 'day':
      case 'date':
        return `${duration}d`;
      case 'week':
        return `${duration}w`;
      case 'month':
        return `${duration}m`;
      default:
        return `${duration}d`;
    }
  };

  return {
    getEarliestStartDate,
    getLatestEndDate,
    calculateDuration,
    formatDuration
  };
}