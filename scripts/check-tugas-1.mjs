import { createJiti } from "jiti";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(root, { alias: { "@": join(root, "src") } });
const sim = await jiti.import(join(root, "src/lib/simulator.ts"));

const { simulate, adjustedHours, formatDuration, formatMoney, itemCost } = sim;

const base = {
  id: "1",
  name: "Desain",
  hours: 10,
  rate: 25000,
  complexity: "Sedang",
  experience: "Senior",
  revisionCount: 0,
};

const r1 = simulate([base], { focusHoursPerDay: 2 });
const r2 = simulate([{ ...base, revisionCount: 2 }], { focusHoursPerDay: 2 });
const empty = simulate([{ id: "x", name: "", hours: Number.NaN, rate: -5 }]);
const zero = simulate([]);
const neg = simulate([{ id: "n", name: "n", hours: -10, rate: -100 }]);
const legacy = simulate([{ id: "legacy", name: "Lama", hours: 10, rate: 25000 }]);

const checks = [
  ["ex1 hours", r1.totalHours, 10],
  ["ex1 cost", r1.totalCost, 250000],
  ["ex1 money", formatMoney(r1.totalCost), "Rp250.000"],
  ["ex1 days", r1.workingDays, 5],
  ["ex1 label", r1.durationLabel, "5 Hari"],
  ["ex2 hours", r2.totalHours, 12],
  ["ex2 cost", r2.totalCost, 300000],
  ["ex2 money", formatMoney(r2.totalCost), "Rp300.000"],
  ["ex2 days", r2.workingDays, 6],
  ["legacy hours", legacy.totalHours, 10],
  ["legacy cost", legacy.totalCost, 250000],
  ["empty nan", [empty.totalHours, empty.totalCost, empty.averageRate].some(Number.isNaN), false],
  ["empty label", empty.durationLabel, "0 Jam"],
  ["zero hours", zero.totalHours, 0],
  ["neg hours", neg.totalHours, 0],
  ["neg nan", Number.isNaN(neg.totalCost), false],
  ["fmt 6 jam", formatDuration(6), "6 Jam"],
  ["fmt 2 hari", formatDuration(16), "2 Hari"],
  ["fmt 1 minggu 2 hari", formatDuration(56), "1 Minggu 2 Hari"],
  ["no frac week", formatDuration(12, 28).includes(","), false],
  ["itemCost adj", itemCost({ ...base, revisionCount: 2 }), 300000],
  ["adjustedHours r2", adjustedHours({ ...base, revisionCount: 2 }), 12],
];

let failed = 0;
for (const [name, actual, expected] of checks) {
  const ok = Object.is(actual, expected);
  if (!ok) failed += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"} ${name}: ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`,
  );
}

console.log("ex2 durationLabel", r2.durationLabel);
console.log("bufferReasons ex1", r1.bufferReasons);
process.exit(failed ? 1 : 0);
