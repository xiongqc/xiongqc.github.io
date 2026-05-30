/*
 * ssDNA Entropic Spring Tension Calculator
 * ---------------------------------------
 * Standalone browser implementation of the stretchable freely-jointed chain
 * force search used for ssDNA spring mechanics in DNA tensegrity/origami models.
 */
(function () {
	"use strict";

	var TENSION_LOG_COLUMNS = [
		{ label: "Step", width: 8 },
		{ label: "Force (N)", width: 18 },
		{ label: "Force (pN)", width: 14 },
		{ label: "Modeled Extension (m)", width: 24 },
		{ label: "Extension (nm)", width: 18 },
		{ label: "Abs Error (m)", width: 16 }
	];

	function x(f, Lc, Lk, kb, T, K) {
		return Lc * (1 / Math.tanh((f * Lk) / (kb * T)) - (kb * T) / (f * Lk)) * (1 + f / K);
	}

	function parseNumber(id) {
		var field = document.getElementById(id),
			value = Number(field.value),
			label = field.getAttribute("data-label") || id;

		if (!Number.isFinite(value)) {
			throw new Error(label + " must be a valid number.");
		}
		return value;
	}

	function parseInteger(id) {
		var field = document.getElementById(id),
			value = Number(field.value),
			label = field.getAttribute("data-label") || id;

		if (!Number.isInteger(value)) {
			throw new Error(label + " must be a whole number.");
		}
		return value;
	}

	function formatScientific(value, sigFigs) {
		return Number(value).toExponential(sigFigs - 1);
	}

	function formatNanometers(value) {
		return (value * 1E9).toFixed(3);
	}

	function formatPiconewtons(value) {
		return (value * 1E12).toFixed(2);
	}

	function formatPiconewtonsForBanner(value) {
		return (value * 1E12).toFixed(1);
	}

	function formatPaddedRow(values, columns) {
		return values.map(function (value, index) {
			return String(value).padEnd(columns[index].width);
		}).join("");
	}

	function buildSeparator(columns) {
		return columns.map(function (column) {
			return "".padEnd(column.width, "-");
		}).join("");
	}

	function calculateSsdnaTension() {
		var N = parseInteger("ssdna-N"),
			lengthInM = parseNumber("ssdna-length"),
			Lk = parseNumber("ssdna-Lk"),
			l = parseNumber("ssdna-l"),
			K = parseNumber("ssdna-K"),
			kb = parseNumber("ssdna-kb"),
			T = parseInteger("ssdna-T"),
			Lc = l * N,
			evaluations = [],
			best = null;

		if (N <= 0 || lengthInM <= 0 || Lk <= 0 || l <= 0 || K <= 0 || kb <= 0 || T <= 0) {
			throw new Error("All ssDNA polymer parameters must be positive.");
		}

		for (var step = 1; step < 200; step += 1) {
			var force = step * 1E-13,
				extension = x(force, Lc, Lk, kb, T, K),
				error = Math.abs(extension - lengthInM),
				evaluation = {
					step: step,
					force: force,
					extension: extension,
					error: error
				};

			evaluations.push(evaluation);

			if (!best || error < best.error) {
				best = evaluation;
			}
		}

		return {
			best: best,
			evaluations: evaluations,
			lengthInM: lengthInM,
			Lc: Lc
		};
	}

	function buildTensionLog(calculation) {
		var best = calculation.best,
			rows = [
				"Target extension: " + formatScientific(calculation.lengthInM, 4) + " m (" + formatNanometers(calculation.lengthInM) + " nm)",
				"Closest modeled extension: " + formatScientific(best.extension, 4) + " m (" + formatNanometers(best.extension) + " nm)",
				"Absolute error: " + formatScientific(best.error, 4) + " m",
				"Contour length: " + formatScientific(calculation.Lc, 4) + " m (" + formatNanometers(calculation.Lc) + " nm)",
				"",
				formatPaddedRow(TENSION_LOG_COLUMNS.map(function (column) {
					return column.label;
				}), TENSION_LOG_COLUMNS),
				buildSeparator(TENSION_LOG_COLUMNS)
			];

		calculation.evaluations.forEach(function (evaluation) {
			rows.push(formatPaddedRow([
				evaluation.step,
				formatScientific(evaluation.force, 4),
				formatPiconewtons(evaluation.force),
				formatScientific(evaluation.extension, 4),
				formatNanometers(evaluation.extension),
				formatScientific(evaluation.error, 4)
			], TENSION_LOG_COLUMNS));
		});

		return rows.join("\n");
	}

	function renderSsdnaTensionCalculation() {
		var output = document.getElementById("ssdna-output-log"),
			banner = document.getElementById("tension-result-banner");

		try {
			var calculation = calculateSsdnaTension();
			banner.classList.remove("alert-warning");
			banner.classList.add("alert-success");
			banner.textContent = "Calculated ssDNA Tendon Force: " + formatPiconewtonsForBanner(calculation.best.force) + " pN";
			output.textContent = buildTensionLog(calculation);
		} catch (error) {
			banner.classList.remove("alert-success");
			banner.classList.add("alert-warning");
			banner.textContent = "Calculated ssDNA Tendon Force: -- pN";
			output.textContent = error.message;
		}
	}

	function copyTensionCitation() {
		var citation = document.getElementById("tension-bibtex").innerText,
			button = document.getElementById("copy-tension-bibtex"),
			originalHtml = button.innerHTML,
			setCopied = function () {
				button.innerHTML = '<i class="fa-solid fa-check me-2"></i>Copied';
				window.setTimeout(function () {
					button.innerHTML = originalHtml;
				}, 1800);
			},
			setCopyUnavailable = function () {
				button.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-2"></i>Copy failed';
				window.setTimeout(function () {
					button.innerHTML = originalHtml;
				}, 1800);
			},
			copyWithSelection = function () {
				var textArea = document.createElement("textarea"),
					copied;

				textArea.value = citation;
				textArea.style.position = "fixed";
				textArea.style.left = "-9999px";
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();
				try {
					copied = document.execCommand("copy");
				} catch (error) {
					copied = false;
				}
				document.body.removeChild(textArea);
				return copied;
			};

		if (copyWithSelection()) {
			setCopied();
			return;
		}

		if (window.navigator && window.navigator.clipboard && window.isSecureContext) {
			window.navigator.clipboard.writeText(citation).then(setCopied).catch(setCopyUnavailable);
			return;
		}

		setCopyUnavailable();
	}

	function initSsdnaTensionCalculator() {
		var calculateButton = document.getElementById("ssdna-calculate"),
			copyButton = document.getElementById("copy-tension-bibtex");

		if (calculateButton) {
			calculateButton.addEventListener("click", renderSsdnaTensionCalculation);
		}

		if (copyButton) {
			copyButton.addEventListener("click", copyTensionCitation);
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initSsdnaTensionCalculator);
	} else {
		initSsdnaTensionCalculator();
	}
}());
