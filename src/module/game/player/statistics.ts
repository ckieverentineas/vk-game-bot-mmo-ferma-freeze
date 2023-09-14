import { Statistics, User } from "@prisma/client";
import prisma from "./../../../module/prisma";
//import { Sleep } from "../../../module/fab/helper";
//import { Randomizer_Float } from "../service";

export interface Statistics_Init {
    id?: number,
    all: Resources,
    day: Resources,
    week: Resources,
    month: Resources,
    id_user: number,
    created_at: Date,
    updated_at: Date,
}
export interface Resources {
    energy: number,
    gold: number,
    gold_from: number,
    gold_to: number,
    xp: number,
    point: number,
    iron: number,
    crystal: number,
    research: number,
    coal: number,
    gas: number,
    oil: number,
    uranium: number,
    golden: number,
    build: number,
    artefact: number,
    update: Date
}

const statistics_empty: Resources = {
    energy: 0,
    gold: 0,
    gold_from: 0,
    gold_to: 0,
    xp: 0,
    point: 0,
    iron: 0,
    crystal: 0,
    research: 0,
    coal: 0,
    gas: 0,
    oil: 0,
    uranium: 0,
    golden: 0,
    build: 0,
    artefact: 0,
    update: new Date()
}
interface Target_List {
    name : "energy" | "gold" | "gold_from" | "gold_to" | "xp" | "point" | "iron" | "crystal" | "research" | "coal" | "gas" | "oil" | "uranium" | "golden" | "build" | "artefact",
    value: number
}
export async function Update_Statistics(user: User, target: Target_List[]) {
    try {
        let statistics: Statistics | null = await prisma.statistics.findFirst({ where: { id_user: user.id } })
        if (!statistics) { statistics = await prisma.statistics.create({ data: { id_user: user.id, all: JSON.stringify(statistics_empty), month: JSON.stringify(statistics_empty), week: JSON.stringify(statistics_empty), day: JSON.stringify(statistics_empty) } }) }
        const all: Resources = JSON.parse(statistics.all)
        //const month: Resources = JSON.parse(statistics.month)
        //const week: Resources = JSON.parse(statistics.week)
        //const day: Resources = JSON.parse(statistics.day)
        for (let i = 0; i < target.length; i++) {
            const target_sel = target[i] 
            all[target_sel.name] = all[target_sel.name] + target_sel.value
        }
        //await Sleep(await Randomizer_Float(1000, 10000))
        await prisma.statistics.update({ where: { id: statistics.id }, data: { all: JSON.stringify(all) } })
        console.log(`Успешное обновление статистики пользователя ${user.idvk}`)
    } catch (error) {
        console.log(error)
    }
}