export async function Randomizer_Float(min: number, max: number) {
	return min + Math.random() * (max - min);
}