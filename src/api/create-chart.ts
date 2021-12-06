import { assert } from '../helpers/assertions';
import { DeepPartial, isString } from '../helpers/strict-type-checks';

import { ChartOptions } from '../model/chart-model';
import { LogicalRange } from '../model/time-data';

import { ChartApi } from './chart-api';
import { IChartApi, MouseEventParams } from './ichart-api';

/**
 * This function is the main entry point of the Lightweight Charting Library.
 *
 * @param container - ID of HTML element or element itself
 * @param options - Any subset of options to be applied at start.
 * @returns An interface to the created chart
 */
export function createChart(container: string | HTMLElement, options?: DeepPartial<ChartOptions>): IChartApi {
	let htmlElement: HTMLElement;
	if (isString(container)) {
		const element = document.getElementById(container);
		assert(element !== null, `Cannot find element in DOM with id=${container}`);
		htmlElement = element;
	} else {
		htmlElement = container;
	}

	return new ChartApi(htmlElement, options);
}

/**
 * Syncronize a set of charts.
 *
 * TODO:
 * - consider config for whether to sync cursor / draw crosshair on all
 * - return a value that allows caller to clean up/dispose after (cleanup fn?)
 *
 * @param charts - The charts to synchronize
 */
export function synchronizeCharts(charts: IChartApi[]): void {
	for (let chart = 0; chart < charts.length; chart++) {
		// Set up time scale synchronization
		charts[chart].timeScale().subscribeVisibleLogicalRangeChange((range: LogicalRange | null) => {
			for (let otherChart = 0; otherChart < charts.length; otherChart++) {
				if (otherChart !== chart && range) {
					charts[otherChart].timeScale().setVisibleLogicalRange(range);
				}
			}
		});
		// Set up crosshair syncronization
		charts[chart].subscribeCrosshairMove((mouseEventParams: MouseEventParams) => {
			for (let otherChart = 0; otherChart < charts.length; otherChart++) {
				if (otherChart !== chart && mouseEventParams.point) {
					// TODO
					// charts[otherChart].testCrosshairMovedElsewhere(mouseEventParams.point.x, mouseEventParams.point.y);
				}
			}
		});
	}
}
