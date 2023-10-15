export async function Randomizer_Float(min: number, max: number) {
	return min + Math.random() * (max - min);
}
export async function Fixed_Number_To_Five(num: number) {
    let res = 0
    res = num < 5 ? 0 : Math.floor(num / 5) * 5
    //console.log(`${num} --> ${res}`)
	return res
}