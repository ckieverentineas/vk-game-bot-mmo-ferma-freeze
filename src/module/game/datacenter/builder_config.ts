import { Research, User } from "@prisma/client";
import { icotransl_list } from "./resources_translator";
import prisma from "../../../module/prisma";

export interface Builder_Init {
    builder: string;
    cost: Cost[];
    input?: Input[];
    output?: Output[];
    require: Require[];
    description: string;
    upgradeble: boolean;
}

export interface Builder_Set {
    builder: string;
    cost: Cost[];
    input?: Input[];
    output?: Output[];
    require: Require[];
    description: string;
}

export interface Cost_Set {
    name: string;
    count: number;
}

export interface Cost {
    name: string;
    count: number;
    koef: number;
}

export interface Input {
    name: string;
    income: number;
    koef: number | 'none';
    time: any;
}

export interface Output {
    name: string;
    outcome: number;
    koef: number;
    time: number;
}

export interface Require {
    [key: string]: {
        name: string, 
        limit: number, 
        koef: number
    }[]
}

export interface Builder_Config_Init {
    [key: string]: {
        id: number,
        name: string,
        description: string,
        cost: { [key: string]: { name: string, price: number, koef: number } },
        input?: { [key: string]: { name: string, income: number, koef: number, time: number } },
        storage?: { [key: string]: { name: string, count: number, limit: number, koef_limit: number } },
        output?: { [key: string]: { name: string, outcome: number, koef: number, time: number } },
        require: { [key: string]: { name: string, limit: number, koef: number } },
    }
}
export interface Builder_Config_Select {
    id: number,
    name: string,
    description: string,
    cost: { [key: string]: { name: string, price: number, koef: number } },
    input?: { [key: string]: { name: string, income: number, koef: number, time: number } },
    storage?: { [key: string]: { name: string, count: number, limit: number, koef_limit: number } },
    output?: { [key: string]: { name: string, outcome: number, koef: number, time: number } },
    require: { [key: string]: { name: string, limit: number, koef: number } },
}
export interface Storages {
    [key: string]: {
        name: string, 
        count: number, 
        limit: number, 
        koef_limit: number
    }
}
export const builder_config: Builder_Config_Init = {
    "Шахты": {
        id: 1,
        name: "Шахты",
        description: "Добывают разнообразные ресурсы из недр планет, необходимые для прокачки",
        cost: {
            gold: { name: "gold", price: 10, koef: 1.3 },
            metal: { name: "metal", price: 5, koef: 1 }
        },
        input: {
            coal: { name: "coal", income: 5, koef: 2, time: 3600000 },
            golden: { name: "golden", income: 5, koef: 1.4, time: 3600000 },
            iron: { name: "iron", income: 5, koef: 1.3, time: 3600000 },
            gas: { name: "gas", income: 0.2, koef: 1.2, time: 3600000 },
            oil: { name: "oil", income: 0.1, koef: 1.2, time: 3600000 },
            artefact: { name: "artefact", income: 0.04, koef: 1.2, time: 3600000 },
            crystal_dirt: { name: "crystal_dirt", income: 0.02, koef: 1.1, time: 3600000 },
            uranium: { name: "uranium", income: 0.01, koef: 1, time: 3600000 },
        },
        output: {
            energy: { name: 'energy', outcome: 1, koef: 1.5, time: 3600000 },
        },
        require: {
            worker: { name: 'worker', limit: 1, koef: 0.01 }
        }
    },
    "Склад": {
        id: 2,
        name: "Склад",
        description: "Здание где хранятся все добытые ресурсы с планеты",
        cost: {
            gold: { name: "gold", price: 500, koef: 1.1 },
            metal: { name: "metal", price: 50, koef: 1.3 }
        },
        storage: {
            coal: { name: "coal", count: 0, limit: 50000, koef_limit: 1.5 },
            gas: { name: "gas", count: 0, limit: 1000, koef_limit: 1.5 },
            oil: { name: "oil", count: 0, limit: 500, koef_limit: 1.5 },
            uranium: { name: "uranium", count: 0, limit: 100, koef_limit: 1.5 },
            iron: { name: "iron", count: 0, limit: 50000, koef_limit: 1.5 },
            golden: { name: "golden", count: 0, limit: 50000, koef_limit: 1.5 },
            artefact: { name: "artefact", count: 0, limit: 100, koef_limit: 1.5 },
            crystal_dirt: { name: "crystal_dirt", count: 0, limit: 10, koef_limit: 1.5 },
        },
        output: {
            energy: { name: 'energy', outcome: 3, koef: 1.5, time: 3600000 },
        },
        require: {
            worker: { name: 'worker', limit: 1, koef: 0.01 }
        }
    },
    "Города": {
        id: 3,
        name: "Города",
        description: "Место в котором отдыхают и живут рабочие",
        cost: {
            gold: { name: "gold", price: 50, koef: 1.3 },
            metal: { name: "metal", price: 25, koef: 1.1 }
        },
        storage: {
            worker: { name: 'worker', count: 0, limit: 7, koef_limit: 0.66 },
        },
        output: {
            energy: { name: 'energy', outcome: 1, koef: 2, time: 3600000 },
        },
        require: {
            worker: { name: 'worker', limit: 1, koef: 0.01 }
        }
    },
    "Электростанция": {
        id: 4,
        name: "Электростанция",
        description: "Производит энергию из горючих ресурсов",
        cost: {
            gold: { name: "gold", price: 10, koef: 1.3 },
            metal: { name: "metal", price: 1, koef: 1.3 }
        },
        input: {
            energy: { name: "energy", income: 5, koef: 1.5, time: 3600000 },
        },
        output: {
            coal: { name: 'coal', outcome: 2, koef: 1.4, time: 3600000 },
        },
        require: {
            worker: { name: 'worker', limit: 1, koef: 0.01 }
        }
    },
    "Центробанк": {
        id: 5,
        name: "Центробанк",
        description: "Создаёт, т.е. чеканит из добытого золота мировую валюту в виде шекелей",
        cost: {
            gold: { name: "gold", price: 1, koef: 1.1 },
            metal: { name: "metal", price: 25, koef: 1.3 }
        },
        input: {
            gold: { name: "gold", income: 5, koef: 1.5, time: 3600000 },
        },
        output: {
            golden: { name: 'golden', outcome: 2, koef: 1.4, time: 3600000 },
            energy: { name: 'energy', outcome: 1, koef: 1.5, time: 3600000 },
        },
        require: {
            worker: { name: 'worker', limit: 1, koef: 0.01 }
        }
    },
    "Завод": {
        id: 6,
        name: "Завод",
        description: "Производит металл из добытой железной руды",
        cost: {
            gold: { name: "gold", price: 75, koef: 1.3 },
            metal: { name: "metal", price: 1, koef: 1.1 }
        },
        input: {
            metal: { name: "metal", income: 5, koef: 1.5, time: 3600000 },
        },
        output: {
            iron: { name: 'iron', outcome: 2, koef: 1.4, time: 3600000 },
            energy: { name: 'energy', outcome: 1, koef: 1.5, time: 3600000 },
        },
        require: {
            worker: { name: 'worker', limit: 1, koef: 0.01 }
        }
    },
    "Археологический центр": {
        id: 7,
        name: "Археологический центр",
        description: "Археологический центр позволяет открывать артефакты, из которых могут выпасть даже площадки к планетам",
        cost: {
            gold: { name: "gold", price: 750, koef: 2 },
            metal: { name: "metal", price: 75, koef: 1.3 }
        },
        input: {
            metal: { name: "metal", income: 5, koef: 1.9, time: 3600000 },
            gold: { name: "gold", income: 5, koef: 2.2, time: 3600000 },
            energy: { name: "energy", income: 5, koef: 2.3, time: 3600000 },
            builder_block: { name: "builder_block", income: 1, koef: 0, time: 3600000 },
        },
        output: {
            artefact: { name: 'artefact', outcome: 1, koef: 1.5, time: 3600000 },
            energy: { name: 'energy', outcome: 1, koef: 2, time: 3600000 },
        },
        require: {
            worker: { name: 'worker', limit: 1, koef: 0.01 }
        }
    },
    "Лаборатория": {
        id: 8,
        name: "Лаборатория",
        description: "Лаборатория позволяет производить исследования",
        cost: {
            gold: { name: "gold", price: 1000, koef: 2 },
            metal: { name: "metal", price: 500, koef: 1.2 }
        },
        input: {
            research: { name: "research", income: 0.01, koef: 0.01, time: 3600000 },
            crystal: { name: "crystal", income: 1, koef: 0.1, time: 3600000 },
        },
        output: {
            energy: { name: 'energy', outcome: 5, koef: 1.4, time: 3600000 },
            crystal_dirt: { name: "crystal_dirt", outcome: 1, koef: 0.1, time: 3600000 },
        },
        require: {
            worker: { name: 'worker', limit: 1, koef: 0.01 }
        }
    },
    "Солнечная панель": {
        id: 4,
        name: "Солнечная панель",
        description: "Бесконечно создаёт энергию от солнца",
        cost: {
            gold: { name: "gold", price: 100000, koef: 1.3838 },
            metal: { name: "metal", price: 1000, koef: 1.3838 }
        },
        input: {
            energy: { name: "energy", income: 5, koef: 1.5, time: 3600000 },
        },
        require: {
            worker: { name: 'worker', limit: 1, koef: 0.01 }
        }
    },
}
export const builder_config_list = ["Шахты", "Склад", "Города", "Электростанция", "Центробанк", "Завод", "Археологический центр", "Лаборатория", "Солнечная панель"]
export async function Printer_Builder_Config(name: string, lvl_be: number, user: User, id_builder?: number) {
    const time_print = '/час'
    console.log(`${name} ${lvl_be} ${user.name}`)
    const builder_configs = builder_config
    let event_logger = ''
    const lvl = lvl_be
    const i = name
    const research: Research | null = await prisma.research.findFirst({ where: { id_user: user.id, name: name } })
    event_logger += `\n\n🏛 Здание: ${builder_configs[i].name}-${id_builder ? id_builder : ''}\n📝 Уровень: ${lvl}/${research?.lvl || 10}`
    //event_logger += `\n💬 Описание: ${builder_configs[i].description}`
    console.log(event_logger)
    if (builder_configs[i].input) {
        event_logger += `\n\n📈 Прибыль: `
        event_logger += `${builder_configs[i].input?.gold != undefined ? `\n${icotransl_list[builder_configs[i].input!.gold.name].smile} ${icotransl_list[builder_configs[i].input!.gold.name].name}: ${(builder_configs[i].input!.gold.income*((lvl)**builder_configs[i].input!.gold.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].input?.energy != undefined ? `\n${icotransl_list[builder_configs[i].input!.energy.name].smile} ${icotransl_list[builder_configs[i].input!.energy.name].name}: ${(builder_configs[i].input!.energy.income*((lvl)**builder_configs[i].input!.energy.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].input?.metal != undefined ? `\n${icotransl_list[builder_configs[i].input!.metal.name].smile} ${icotransl_list[builder_configs[i].input!.metal.name].name}: ${(builder_configs[i].input!.metal.income*((lvl)**builder_configs[i].input!.metal.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].input?.crystal != undefined ? `\n${icotransl_list[builder_configs[i].input!.crystal.name].smile} ${icotransl_list[builder_configs[i].input!.crystal.name].name}: ${(builder_configs[i].input!.crystal.income*((lvl)**builder_configs[i].input!.crystal.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].input?.crystal_dirt != undefined ? `\n${icotransl_list[builder_configs[i].input!.crystal_dirt.name].smile} ${icotransl_list[builder_configs[i].input!.crystal_dirt.name].name}: ${(builder_configs[i].input!.crystal_dirt.income*((lvl)**builder_configs[i].input!.crystal_dirt.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].input?.artefact != undefined ? `\n${icotransl_list[builder_configs[i].input!.artefact.name].smile} ${icotransl_list[builder_configs[i].input!.artefact.name].name}: ${(builder_configs[i].input!.artefact.income*((lvl)**builder_configs[i].input!.artefact.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].input?.golden != undefined ? `\n${icotransl_list[builder_configs[i].input!.golden.name].smile} ${icotransl_list[builder_configs[i].input!.golden.name].name}: ${(builder_configs[i].input!.golden.income*((lvl)**builder_configs[i].input!.golden.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].input?.iron != undefined ? `\n${icotransl_list[builder_configs[i].input!.iron.name].smile} ${icotransl_list[builder_configs[i].input!.iron.name].name}: ${(builder_configs[i].input!.iron.income*((lvl)**builder_configs[i].input!.iron.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].input?.uranium != undefined ? `\n${icotransl_list[builder_configs[i].input!.uranium.name].smile} ${icotransl_list[builder_configs[i].input!.uranium.name].name}: ${(builder_configs[i].input!.uranium.income*((lvl)**builder_configs[i].input!.uranium.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].input?.oil != undefined ? `\n${icotransl_list[builder_configs[i].input!.oil.name].smile} ${icotransl_list[builder_configs[i].input!.oil.name].name}: ${(builder_configs[i].input!.oil.income*((lvl)**builder_configs[i].input!.oil.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].input?.gas != undefined ? `\n${icotransl_list[builder_configs[i].input!.gas.name].smile} ${icotransl_list[builder_configs[i].input!.gas.name].name}: ${(builder_configs[i].input!.gas.income*((lvl)**builder_configs[i].input!.gas.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].input?.coal != undefined ? `\n${icotransl_list[builder_configs[i].input!.coal.name].smile} ${icotransl_list[builder_configs[i].input!.coal.name].name}: ${(builder_configs[i].input!.coal.income*((lvl)**builder_configs[i].input!.coal.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].input?.builder_block != undefined ? `\n${icotransl_list[builder_configs[i].input!.builder_block.name].smile} ${icotransl_list[builder_configs[i].input!.builder_block.name].name}: ${(builder_configs[i].input!.builder_block.income*((lvl)**builder_configs[i].input!.builder_block.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].input?.research != undefined ? `\n${icotransl_list[builder_configs[i].input!.research.name].smile} ${icotransl_list[builder_configs[i].input!.research.name].name}: ${(builder_configs[i].input!.research.income*((lvl)**builder_configs[i].input!.research.koef)).toFixed(2)}${time_print}` : ""}`
    }
    if (builder_configs[i].storage) {
        if (id_builder) {
            const buildstore = await prisma.builder.findFirst({ where: { id: id_builder } })
            if (buildstore && buildstore.storage) { builder_configs[i].storage = JSON.parse(buildstore.storage) }
        }
        event_logger += `\n\n📦 Хранилище: `
        event_logger += `${builder_configs[i].storage?.gold != undefined ? `\n${icotransl_list[builder_configs[i].storage!.gold.name].smile} ${icotransl_list[builder_configs[i].storage!.gold.name].name}: ${builder_configs[i].storage!.gold.count.toFixed(2)}/${(builder_configs[i].storage!.gold.limit*((lvl)**builder_configs[i].storage!.gold.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.energy != undefined ? `\n${icotransl_list[builder_configs[i].storage!.energy.name].smile} ${icotransl_list[builder_configs[i].storage!.energy.name].name}: ${builder_configs[i].storage!.energy.count.toFixed(2)}/${(builder_configs[i].storage!.energy.limit*((lvl)**builder_configs[i].storage!.energy.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.metal != undefined ? `\n${icotransl_list[builder_configs[i].storage!.metal.name].smile} ${icotransl_list[builder_configs[i].storage!.metal.name].name}: ${builder_configs[i].storage!.metal.count.toFixed(2)}/${(builder_configs[i].storage!.metal.limit*((lvl)**builder_configs[i].storage!.metal.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.crystal != undefined ? `\n${icotransl_list[builder_configs[i].storage!.crystal.name].smile} ${icotransl_list[builder_configs[i].storage!.crystal.name].name}: ${builder_configs[i].storage!.crystal.count.toFixed(2)}/${(builder_configs[i].storage!.crystal.limit*((lvl)**builder_configs[i].storage!.crystal.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.crystal_dirt != undefined ? `\n${icotransl_list[builder_configs[i].storage!.crystal_dirt.name].smile} ${icotransl_list[builder_configs[i].storage!.crystal_dirt.name].name}: ${builder_configs[i].storage!.crystal_dirt.count.toFixed(2)}/${(builder_configs[i].storage!.crystal_dirt.limit*((lvl)**builder_configs[i].storage!.crystal_dirt.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.artefact != undefined ? `\n${icotransl_list[builder_configs[i].storage!.artefact.name].smile} ${icotransl_list[builder_configs[i].storage!.artefact.name].name}: ${builder_configs[i].storage!.artefact.count.toFixed(2)}/${(builder_configs[i].storage!.artefact.limit*((lvl)**builder_configs[i].storage!.artefact.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.golden != undefined ? `\n${icotransl_list[builder_configs[i].storage!.golden.name].smile} ${icotransl_list[builder_configs[i].storage!.golden.name].name}: ${builder_configs[i].storage!.golden.count.toFixed(2)}/${(builder_configs[i].storage!.golden.limit*((lvl)**builder_configs[i].storage!.golden.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.iron != undefined ? `\n${icotransl_list[builder_configs[i].storage!.iron.name].smile} ${icotransl_list[builder_configs[i].storage!.iron.name].name}: ${builder_configs[i].storage!.iron.count.toFixed(2)}/${(builder_configs[i].storage!.iron.limit*((lvl)**builder_configs[i].storage!.iron.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.uranium != undefined ? `\n${icotransl_list[builder_configs[i].storage!.uranium.name].smile} ${icotransl_list[builder_configs[i].storage!.uranium.name].name}: ${builder_configs[i].storage!.uranium.count.toFixed(2)}/${(builder_configs[i].storage!.uranium.limit*((lvl)**builder_configs[i].storage!.uranium.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.oil != undefined ? `\n${icotransl_list[builder_configs[i].storage!.oil.name].smile} ${icotransl_list[builder_configs[i].storage!.oil.name].name}: ${builder_configs[i].storage!.oil.count.toFixed(2)}/${(builder_configs[i].storage!.oil.limit*((lvl)**builder_configs[i].storage!.oil.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.gas != undefined ? `\n${icotransl_list[builder_configs[i].storage!.gas.name].smile} ${icotransl_list[builder_configs[i].storage!.gas.name].name}: ${builder_configs[i].storage!.gas.count.toFixed(2)}/${(builder_configs[i].storage!.gas.limit*((lvl)**builder_configs[i].storage!.gas.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.coal != undefined ? `\n${icotransl_list[builder_configs[i].storage!.coal.name].smile} ${icotransl_list[builder_configs[i].storage!.coal.name].name}: ${builder_configs[i].storage!.coal.count.toFixed(2)}/${(builder_configs[i].storage!.coal.limit*((lvl)**builder_configs[i].storage!.coal.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.builder_block != undefined ? `\n${icotransl_list[builder_configs[i].storage!.builder_block.name].smile} ${icotransl_list[builder_configs[i].storage!.builder_block.name].name}: ${builder_configs[i].storage!.builder_block.count.toFixed(2)}/${(builder_configs[i].storage!.builder_block.limit*((lvl)**builder_configs[i].storage!.builder_block.koef_limit)).toFixed(0)}` : ""}`
        event_logger += `${builder_configs[i].storage?.worker != undefined ? `\n${icotransl_list[builder_configs[i].storage!.worker.name].smile} ${icotransl_list[builder_configs[i].storage!.worker.name].name}: ${builder_configs[i].storage!.worker.count.toFixed(0)}/${(builder_configs[i].storage!.worker.limit*((lvl)**builder_configs[i].storage!.worker.koef_limit)).toFixed(0)}` : ""}`
    }
    if (builder_configs[i].output) {
        event_logger += `\n\n📉 Потребление: `
        event_logger += `${builder_configs[i].output?.gold != undefined ? `\n${icotransl_list[builder_configs[i].output!.gold.name].smile} ${icotransl_list[builder_configs[i].output!.gold.name].name}: ${(builder_configs[i].output!.gold.outcome*((lvl)**builder_configs[i].output!.gold.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].output?.energy != undefined ? `\n${icotransl_list[builder_configs[i].output!.energy.name].smile} ${icotransl_list[builder_configs[i].output!.energy.name].name}: ${(builder_configs[i].output!.energy.outcome*((lvl)**builder_configs[i].output!.energy.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].output?.metal != undefined ? `\n${icotransl_list[builder_configs[i].output!.metal.name].smile} ${icotransl_list[builder_configs[i].output!.metal.name].name}: ${(builder_configs[i].output!.metal.outcome*((lvl)**builder_configs[i].output!.metal.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].output?.crystal != undefined ? `\n${icotransl_list[builder_configs[i].output!.crystal.name].smile} ${icotransl_list[builder_configs[i].output!.crystal.name].name}: ${(builder_configs[i].output!.crystal.outcome*((lvl)**builder_configs[i].output!.crystal.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].output?.crystal_dirt != undefined ? `\n${icotransl_list[builder_configs[i].output!.crystal_dirt.name].smile} ${icotransl_list[builder_configs[i].output!.crystal_dirt.name].name}: ${(builder_configs[i].output!.crystal_dirt.outcome*((lvl)**builder_configs[i].output!.crystal_dirt.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].output?.artefact != undefined ? `\n${icotransl_list[builder_configs[i].output!.artefact.name].smile} ${icotransl_list[builder_configs[i].output!.artefact.name].name}: ${(builder_configs[i].output!.artefact.outcome*((lvl)**builder_configs[i].output!.artefact.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].output?.golden != undefined ? `\n${icotransl_list[builder_configs[i].output!.golden.name].smile} ${icotransl_list[builder_configs[i].output!.golden.name].name}: ${(builder_configs[i].output!.golden.outcome*((lvl)**builder_configs[i].output!.golden.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].output?.iron != undefined ? `\n${icotransl_list[builder_configs[i].output!.iron.name].smile} ${icotransl_list[builder_configs[i].output!.iron.name].name}: ${(builder_configs[i].output!.iron.outcome*((lvl)**builder_configs[i].output!.iron.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].output?.uranium != undefined ? `\n${icotransl_list[builder_configs[i].output!.uranium.name].smile} ${icotransl_list[builder_configs[i].output!.uranium.name].name}: ${(builder_configs[i].output!.uranium.outcome*((lvl)**builder_configs[i].output!.uranium.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].output?.oil != undefined ? `\n${icotransl_list[builder_configs[i].output!.oil.name].smile} ${icotransl_list[builder_configs[i].output!.oil.name].name}: ${(builder_configs[i].output!.oil.outcome*((lvl)**builder_configs[i].output!.oil.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].output?.gas != undefined ? `\n${icotransl_list[builder_configs[i].output!.gas.name].smile} ${icotransl_list[builder_configs[i].output!.gas.name].name}: ${(builder_configs[i].output!.gas.outcome*((lvl)**builder_configs[i].output!.gas.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].output?.coal != undefined ? `\n${icotransl_list[builder_configs[i].output!.coal.name].smile} ${icotransl_list[builder_configs[i].output!.coal.name].name}: ${(builder_configs[i].output!.coal.outcome*((lvl)**builder_configs[i].output!.coal.koef)).toFixed(2)}${time_print}` : ""}`
        event_logger += `${builder_configs[i].output?.builder_block != undefined ? `\n${icotransl_list[builder_configs[i].output!.builder_block.name].smile} ${icotransl_list[builder_configs[i].output!.builder_block.name].name}: ${(builder_configs[i].output!.builder_block.outcome*((lvl)**builder_configs[i].output!.builder_block.koef)).toFixed(2)}${time_print}` : ""}`
    }
    if (builder_configs[i].require) {
        event_logger += `\n\n⚙ Требование: `
        event_logger += `${builder_configs[i].require?.worker != undefined ? `\n${icotransl_list[builder_configs[i].require!.worker.name].smile} ${icotransl_list[builder_configs[i].require!.worker.name].name}: ${(builder_configs[i].require!.worker.limit*((lvl)**builder_configs[i].require!.worker.koef)).toFixed(0)}` : ""}`
    }
    event_logger += `\n\n📐 Стоимость при улучшении: ${(builder_configs[i].cost.gold.price*(lvl)**builder_configs[i].cost.gold.koef).toFixed(2)}${icotransl_list[builder_configs[i].cost.gold.name].smile} ${(builder_configs[i].cost.metal.price*(lvl)**builder_configs[i].cost.metal.koef).toFixed(2)}${icotransl_list[builder_configs[i].cost.metal.name].smile}\n`
    return event_logger
}