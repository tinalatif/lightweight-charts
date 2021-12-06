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

// TODO: what operations might we want to perform on a IChartStack?
interface IChartStack {

}



/*
NEW ALGORITHM FOR PRICE SCALE

fuck state.
expose a method to retrieve the actual width of the price pane
then we can get the real values each time without worrying about passing
around / resetting state





*/


// note - it seems like we rely on having the same dates / number of bars across each series

// TODO: create_stacked_chart.ts?
export function createStackedChart(charts: IChartApi[]): IChartStack {
	for (let i = 0; i < charts.length; i++) {
		// TODO: just remove this, it should be set by the supplied charts rather than us
		if (i !== charts.length - 1) {
			charts[i].applyOptions({ timeScale: { visible: false } });
		}

		// set up time scale synchronization
		charts[i].timeScale().subscribeVisibleLogicalRangeChange((range: LogicalRange | null) => {
			// let maxWidth = 0;
			for (let t = 0; t < charts.length; t++) {
				// console.log("priceScale().width(): " + charts[t].priceScale('right').width());
				// maxWidth = Math.max(maxWidth, charts[t].priceScale('right').width());
				if (range !== null && t !== i) {
					charts[t].timeScale().setVisibleLogicalRange(range);
				}
			}
			// console.log("maxWidth: " + maxWidth);
			
			// set the widths to be consistent
			// for (let t = 0; t < charts.length; t++) {
			// 	charts[t].setRightPriceAxisWidth(maxWidth);
			// }
		});

		// charts[i].timeScale().subscribeVisibleTimeRangeChange((timeRange: TimeRange | null) => {
		// 	const barSpacing = charts[i].timeScale().options().barSpacing;
		// 	const scrollPosition = charts[i].timeScale().scrollPosition();
		// 	for (let t = 0; t < charts.length; t++) {
		// 		if (timeRange !== null && i !== t) {
		// 			charts[t].timeScale().applyOptions({ rightOffset: scrollPosition, barSpacing });
		// 		}
		// 	}
		// });

		// set up crosshair move subscription
		charts[i].subscribeCrosshairMove((mouseEventParams: MouseEventParams) => {
			let maxWidth = 0;
			for (let j = 0; j < charts.length; j++) {
				//const series = mouseEventParams.hoveredSeries;
				//if (series in charts[i].series)
				maxWidth = Math.max(maxWidth, charts[j].priceScale('right').width());
				if (mouseEventParams.point && j !== i) {
					// the problem: calling crosshairMoved here is triggering our own
					// crosshair moved subscriber

					// we need a way to ignore events that we generated ourselves. maybe we can add some 
					// data to the event payload to distinguish them

					// maybe we can compare the series? look at the mouse event params

					charts[j].testCrosshairMovedElsewhere(mouseEventParams.point.x, mouseEventParams.point.y);
				}
			}
			for (let t = 0; t < charts.length; t++) {
				console.log('setting maxWidth to ' + maxWidth);
				charts[t].setRightPriceAxisWidth(maxWidth);
			}
		});
	}
	return {};
}


