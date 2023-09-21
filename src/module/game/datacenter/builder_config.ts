import { icotransl_list } from "./resources_translator";

export const buildin: Builder_Init[] = [
    { 
        builder: "Шахты",
        description: "Добывают разнообразные ресурсы из недр планет, необходимые для прокачки",
        cost: [
            { name: 'gold', count: 100, koef: 1.3838 },
            { name: 'iron', count: 10, koef: 1.3838 },
        ],
        input: [
            { name: 'coal', income: 5, koef: 2, time: 3600000 },
            { name: 'gas', income: 50, koef: 1.5, time: 86400000 },
            { name: 'oil', income: 25, koef: 1.4, time: 86400000 },
            { name: 'slate', income: 10, koef: 1.3, time: 86400000 },
            { name: 'turf', income: 5, koef: 1.2, time: 86400000 },
            { name: 'uranium', income: 1, koef: 1.1, time: 86400000 },

            { name: 'iron', income: 5, koef: 1.5, time: 3600000 },
            { name: 'golden', income: 5, koef: 1.5, time: 3600000 },
            { name: 'artefact', income: 2, koef: 1.2, time: 86400000 },
            { name: 'crystal', income: 1, koef: 1.1, time: 86400000 },
        ],
        output: [
            { name: 'energy', outcome: 1, koef: 1.5, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 0.01 }
        ],
        upgradeble: true
    },
    {
        builder: "Склад",
        description: 'Здание где хранятся все добытые ресурсы с планеты',
        cost: [
            { name: 'gold', count: 100, koef: 1.3838 },
            { name: 'iron', count: 10, koef: 1.3838 },
        ],
        input: [
            { name: 'coal', income: 0, koef: 'none', time: 'none' },
            { name: 'gas', income: 0, koef: 'none', time: 'none' },
            { name: 'oil', income: 0, koef: 'none', time: 'none' },
            { name: 'slate', income: 0, koef: 'none', time: 'none' },
            { name: 'turf', income: 0, koef: 'none', time: 'none' },
            { name: 'uranium', income: 0, koef: 'none', time: 'none' },
            
            { name: 'iron', income: 0, koef: 'none', time: 'none' },
            { name: 'golden', income: 0, koef: 'none', time: 'none' },
            { name: 'artefact', income: 0, koef: 'none', time: 'none' },
            { name: 'crystal', income: 0, koef: 'none', time: 'none' },
        ],
        output: [
            { name: 'energy', outcome: 1, koef: 1.4, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 0.01 }
        ],
        upgradeble: false
    },
    {
        builder: "Города",
        description: 'Место в котором отдыхают и живут рабочие',
        cost: [
            { name: 'gold', count: 100, koef: 1.3838 },
            { name: 'iron', count: 10, koef: 1.3838 },
        ],
        input: [
            { name: 'worker', income: 5, koef: 0.66, time: 'none' },
        ],
        output: [
            { name: 'energy', outcome: 1, koef: 1.4, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 0.01 }
        ],
        upgradeble: true
    },
    { 
        builder: "Электростанция",
        description: 'Производит энергию из горючих ресурсов',
        cost: [
            { name: 'gold', count: 100, koef: 1.3838 },
            { name: 'iron', count: 10, koef: 1.3838 },
        ],
        input: [
            { name: 'energy', income: 5, koef: 1.5, time: 3600000 },
        ],
        output: [
            { name: 'coal', outcome: 1, koef: 1.4, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 0.01 }
        ],
        upgradeble: true
    },
    { 
        builder: "Центробанк",
        description: 'Создаёт из золота шекели',
        cost: [
            { name: 'gold', count: 100, koef: 1.3838 },
            { name: 'iron', count: 10, koef: 1.3838 },
        ],
        input: [
            { name: 'gold', income: 5, koef: 1.5, time: 3600000 },
        ],
        output: [
            { name: 'energy', outcome: 1, koef: 1.5, time: 3600000 },
            { name: 'golden', outcome: 1, koef: 1.4, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 0.01 }
        ],
        upgradeble: true
    },
    { 
        builder: "Завод",
        description: 'Производит железо из железной руды',
        cost: [
            { name: 'gold', count: 100, koef: 1.3838 },
            { name: 'iron', count: 10, koef: 1.3838 },
        ],
        input: [
            { name: 'iron', income: 5, koef: 1.5, time: 3600000 },
        ],
        output: [
            { name: 'energy', outcome: 1, koef: 1.5, time: 3600000 },
            { name: 'iron', outcome: 1, koef: 1.4, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 0.01 }
        ],
        upgradeble: true
    },
    {
        builder: "Археологический центр",
        description: 'Археологический центр позволяет открывать артефакты, из которых могут выпасть даже площадки к планетам',
        cost: [
            { name: 'gold', count: 100, koef: 1.3838 },
            { name: 'iron', count: 10, koef: 1.3838 },
        ],
        output: [
            { name: 'artefact', outcome: 1, koef: 1.5, time: 86400000 },
            { name: 'energy', outcome: 1, koef: 1.4, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 0.01 }
        ],
        upgradeble: false
    },
    {
        builder: "Лаборатория",
        description: 'Лаборатория позволяет производить исследования',
        cost: [
            { name: 'gold', count: 1000, koef: 1.3838 },
            { name: 'iron', count: 500, koef: 1.3838 },
        ],
        input: [
            { name: 'research', income: 1, koef: 0.1, time: 86400000 },
        ],
        output: [
            { name: 'energy', outcome: 5, koef: 1.4, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 0.01 }
        ],
        upgradeble: true
    },
    { 
        builder: "Солнечная панель",
        description: 'Бесконечно создаёт энергию от солнца',
        cost: [
            { name: 'gold', count: 100000, koef: 1.3838 },
            { name: 'iron', count: 1000, koef: 1.3838 },
        ],
        input: [
            { name: 'energy', income: 5, koef: 1.5, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 0.01 }
        ],
        upgradeble: true
    },
    //"Утилизатор": { price: 100, income: 5, cost: 100, koef_price: 1.3838, koef_income: 1.5, type: 'gold', smile: '💰', description: "Офис является штабом вашего бизнеса и фискирует прибыль в шекелях" },
    
    //"Фабрика": { price: 100, income: 5, cost: 100, koef_price: 1.3838, koef_income: 1.5, type: 'energy', smile: '⚡', description: "Электростанция является источником энергии для вашего бизнеса в виде энергии" }
]

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
    name: string;
    limit: number;
    koef: number;
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
export const builder_config: Builder_Config_Init = {
    "Шахты": {
        id: 1,
        name: "Шахты",
        description: "Добывают разнообразные ресурсы из недр планет, необходимые для прокачки",
        cost: {
            gold: { name: "gold", price: 100, koef: 1.3838 },
            metal: { name: "metal", price: 10, koef: 1.3838 }
        },
        input: {
            coal: { name: "coal", income: 5, koef: 2, time: 3600000 },
            gas: { name: "gas", income: 50, koef: 1.5, time: 86400000 },
            oil: { name: "oil", income: 25, koef: 1.4, time: 86400000 },
            uranium: { name: "uranium", income: 1, koef: 1.1, time: 86400000 },
            iron: { name: "iron", income: 5, koef: 1.5, time: 3600000 },
            golden: { name: "golden", income: 5, koef: 1.5, time: 3600000 },
            artefact: { name: "artefact", income: 2, koef: 1.2, time: 86400000 },
            crystal_dirt: { name: "crystal_dirt", income: 1, koef: 1.1, time: 86400000 },
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
            gold: { name: "gold", price: 100, koef: 1.3838 },
            metal: { name: "metal", price: 10, koef: 1.3838 }
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
            energy: { name: 'energy', outcome: 1, koef: 1.5, time: 3600000 },
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
            gold: { name: "gold", price: 100, koef: 1.3838 },
            metal: { name: "metal", price: 10, koef: 1.3838 }
        },
        storage: {
            worker: { name: 'worker', count: 0, limit: 5, koef_limit: 0.66 },
        },
        output: {
            energy: { name: 'energy', outcome: 1, koef: 1.5, time: 3600000 },
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
            gold: { name: "gold", price: 100, koef: 1.3838 },
            metal: { name: "metal", price: 10, koef: 1.3838 }
        },
        input: {
            energy: { name: "energy", income: 5, koef: 1.5, time: 3600000 },
        },
        output: {
            coal: { name: 'coal', outcome: 1, koef: 1.4, time: 3600000 },
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
            gold: { name: "gold", price: 100, koef: 1.3838 },
            metal: { name: "metal", price: 10, koef: 1.3838 }
        },
        input: {
            gold: { name: "gold", income: 5, koef: 1.5, time: 3600000 },
        },
        output: {
            golden: { name: 'golden', outcome: 1, koef: 1.4, time: 3600000 },
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
            gold: { name: "gold", price: 100, koef: 1.3838 },
            metal: { name: "metal", price: 10, koef: 1.3838 }
        },
        input: {
            metal: { name: "metal", income: 5, koef: 1.5, time: 3600000 },
        },
        output: {
            iron: { name: 'iron', outcome: 1, koef: 1.4, time: 3600000 },
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
            gold: { name: "gold", price: 100, koef: 1.3838 },
            metal: { name: "metal", price: 10, koef: 1.3838 }
        },
        input: {
            metal: { name: "metal", income: 5, koef: 1.5, time: 3600000 },
            gold: { name: "gold", income: 5, koef: 1.5, time: 3600000 },
            energy: { name: "energy", income: 5, koef: 1.5, time: 3600000 },
            builder_block: { name: "builder_block", income: 1, koef: 0, time: 86400000 },
        },
        output: {
            artefact: { name: 'artefact', outcome: 1, koef: 0, time: 3600000 },
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
            gold: { name: "gold", price: 1000, koef: 1.3838 },
            metal: { name: "metal", price: 500, koef: 1.3838 }
        },
        input: {
            research: { name: "research", income: 1, koef: 0.1, time: 86400000 },
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

let event_logger = ''
const lvl = 1
for (const i of ["Шахты", "Склад", "Города", "Электростанция", "Центробанк", "Завод", "Археологический центр", "Лаборатория", "Солнечная панель"]) {
    event_logger += `\n\nЗдание: ${builder_config[i].name}\n`
    event_logger += `Описание: ${builder_config[i].description}\n`
    event_logger += `Стоимость: ${builder_config[i].cost.gold.price*(lvl)**builder_config[i].cost.gold.koef}${icotransl_list[builder_config[i].cost.gold.name].smile} ${builder_config[i].cost.metal.price*(lvl)**builder_config[i].cost.metal.koef}${icotransl_list[builder_config[i].cost.metal.name].smile}\n`
    if (builder_config[i].input) {
        event_logger += `\nПрибыль: `
        event_logger += ` ${builder_config[i].input?.gold != undefined ? `${builder_config[i].input!.gold.income*((lvl)**builder_config[i].input!.gold.koef)}${icotransl_list[builder_config[i].input!.gold.name].smile}/${builder_config[i].input!.gold.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].input?.energy != undefined ? `${builder_config[i].input!.energy.income*((lvl)**builder_config[i].input!.energy.koef)}${icotransl_list[builder_config[i].input!.energy.name].smile}/${builder_config[i].input!.energy.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].input?.metal != undefined ? `${builder_config[i].input!.metal.income*((lvl)**builder_config[i].input!.metal.koef)}${icotransl_list[builder_config[i].input!.metal.name].smile}/${builder_config[i].input!.metal.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].input?.crystal != undefined ? `${builder_config[i].input!.crystal.income*((lvl)**builder_config[i].input!.crystal.koef)}${icotransl_list[builder_config[i].input!.crystal.name].smile}/${builder_config[i].input!.crystal.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].input?.crystal_dirt != undefined ? `${builder_config[i].input!.crystal_dirt.income*((lvl)**builder_config[i].input!.crystal_dirt.koef)}${icotransl_list[builder_config[i].input!.crystal_dirt.name].smile}/${builder_config[i].input!.crystal_dirt.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].input?.artefact != undefined ? `${builder_config[i].input!.artefact.income*((lvl)**builder_config[i].input!.artefact.koef)}${icotransl_list[builder_config[i].input!.artefact.name].smile}/${builder_config[i].input!.artefact.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].input?.golden != undefined ? `${builder_config[i].input!.golden.income*((lvl)**builder_config[i].input!.golden.koef)}${icotransl_list[builder_config[i].input!.golden.name].smile}/${builder_config[i].input!.golden.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].input?.iron != undefined ? `${builder_config[i].input!.iron.income*((lvl)**builder_config[i].input!.iron.koef)}${icotransl_list[builder_config[i].input!.iron.name].smile}/${builder_config[i].input!.iron.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].input?.uranium != undefined ? `${builder_config[i].input!.uranium.income*((lvl)**builder_config[i].input!.uranium.koef)}${icotransl_list[builder_config[i].input!.uranium.name].smile}/${builder_config[i].input!.uranium.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].input?.oil != undefined ? `${builder_config[i].input!.oil.income*((lvl)**builder_config[i].input!.oil.koef)}${icotransl_list[builder_config[i].input!.oil.name].smile}/${builder_config[i].input!.oil.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].input?.gas != undefined ? `${builder_config[i].input!.gas.income*((lvl)**builder_config[i].input!.gas.koef)}${icotransl_list[builder_config[i].input!.gas.name].smile}/${builder_config[i].input!.gas.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].input?.coal != undefined ? `${builder_config[i].input!.coal.income*((lvl)**builder_config[i].input!.coal.koef)}${icotransl_list[builder_config[i].input!.coal.name].smile}/${builder_config[i].input!.coal.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].input?.builder_block != undefined ? `${builder_config[i].input!.builder_block.income*((lvl)**builder_config[i].input!.builder_block.koef)}${icotransl_list[builder_config[i].input!.builder_block.name].smile}/${builder_config[i].input!.builder_block.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].input?.research != undefined ? `${builder_config[i].input!.research.income*((lvl)**builder_config[i].input!.research.koef)}${icotransl_list[builder_config[i].input!.research.name].smile}/${builder_config[i].input!.research.time == 3600000 ? "час": "сутки"} ` : ""}`
    }
    if (builder_config[i].storage) {
        event_logger += `\nХранилище: `
        event_logger += ` ${builder_config[i].storage?.gold != undefined ? `${builder_config[i].storage!.gold.count}/${builder_config[i].storage!.gold.limit*((lvl)**builder_config[i].storage!.gold.koef_limit)}${icotransl_list[builder_config[i].storage!.gold.name].smile} ` : ""}`
        event_logger += ` ${builder_config[i].storage?.energy != undefined ? `${builder_config[i].storage!.energy.count}/${builder_config[i].storage!.energy.limit*((lvl)**builder_config[i].storage!.energy.koef_limit)}${icotransl_list[builder_config[i].storage!.energy.name].smile} ` : ""}`
        event_logger += ` ${builder_config[i].storage?.metal != undefined ? `${builder_config[i].storage!.metal.count}/${builder_config[i].storage!.metal.limit*((lvl)**builder_config[i].storage!.metal.koef_limit)}${icotransl_list[builder_config[i].storage!.metal.name].smile} ` : ""}`
        event_logger += ` ${builder_config[i].storage?.crystal != undefined ? `${builder_config[i].storage!.crystal.count}/${builder_config[i].storage!.crystal.limit*((lvl)**builder_config[i].storage!.crystal.koef_limit)}${icotransl_list[builder_config[i].storage!.crystal.name].smile} ` : ""}`
        event_logger += ` ${builder_config[i].storage?.crystal_dirt != undefined ? `${builder_config[i].storage!.crystal_dirt.count}/${builder_config[i].storage!.crystal_dirt.limit*((lvl)**builder_config[i].storage!.crystal_dirt.koef_limit)}${icotransl_list[builder_config[i].storage!.crystal_dirt.name].smile} ` : ""}`
        event_logger += ` ${builder_config[i].storage?.artefact != undefined ? `${builder_config[i].storage!.artefact.count}/${builder_config[i].storage!.artefact.limit*((lvl)**builder_config[i].storage!.artefact.koef_limit)}${icotransl_list[builder_config[i].storage!.artefact.name].smile} ` : ""}`
        event_logger += ` ${builder_config[i].storage?.golden != undefined ? `${builder_config[i].storage!.golden.count}/${builder_config[i].storage!.golden.limit*((lvl)**builder_config[i].storage!.golden.koef_limit)}${icotransl_list[builder_config[i].storage!.golden.name].smile} ` : ""}`
        event_logger += ` ${builder_config[i].storage?.iron != undefined ? `${builder_config[i].storage!.iron.count}/${builder_config[i].storage!.iron.limit*((lvl)**builder_config[i].storage!.iron.koef_limit)}${icotransl_list[builder_config[i].storage!.iron.name].smile} ` : ""}`
        event_logger += ` ${builder_config[i].storage?.uranium != undefined ? `${builder_config[i].storage!.uranium.count}/${builder_config[i].storage!.uranium.limit*((lvl)**builder_config[i].storage!.uranium.koef_limit)}${icotransl_list[builder_config[i].storage!.uranium.name].smile} ` : ""}`
        event_logger += ` ${builder_config[i].storage?.oil != undefined ? `${builder_config[i].storage!.oil.count}/${builder_config[i].storage!.oil.limit*((lvl)**builder_config[i].storage!.oil.koef_limit)}${icotransl_list[builder_config[i].storage!.oil.name].smile} ` : ""}`
        event_logger += ` ${builder_config[i].storage?.gas != undefined ? `${builder_config[i].storage!.gas.count}/${builder_config[i].storage!.gas.limit*((lvl)**builder_config[i].storage!.gas.koef_limit)}${icotransl_list[builder_config[i].storage!.gas.name].smile} ` : ""}`
        event_logger += ` ${builder_config[i].storage?.coal != undefined ? `${builder_config[i].storage!.coal.count}/${builder_config[i].storage!.coal.limit*((lvl)**builder_config[i].storage!.coal.koef_limit)}${icotransl_list[builder_config[i].storage!.coal.name].smile} ` : ""}`
        event_logger += ` ${builder_config[i].storage?.builder_block != undefined ? `${builder_config[i].storage!.builder_block.count}/${builder_config[i].storage!.builder_block.limit*((lvl)**builder_config[i].storage!.builder_block.koef_limit)}${icotransl_list[builder_config[i].storage!.builder_block.name].smile} ` : ""}`
        event_logger += ` ${builder_config[i].storage?.worker != undefined ? `${builder_config[i].storage!.worker.count}/${builder_config[i].storage!.worker.limit*((lvl)**builder_config[i].storage!.worker.koef_limit)}${icotransl_list[builder_config[i].storage!.worker.name].smile} ` : ""}`
    }
    if (builder_config[i].output) {
        event_logger += `\nПотребление: `
        event_logger += ` ${builder_config[i].output?.gold != undefined ? `${builder_config[i].output!.gold.outcome*((lvl)**builder_config[i].output!.gold.koef)}${icotransl_list[builder_config[i].output!.gold.name].smile}/${builder_config[i].output!.gold.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].output?.energy != undefined ? `${builder_config[i].output!.energy.outcome*((lvl)**builder_config[i].output!.energy.koef)}${icotransl_list[builder_config[i].output!.energy.name].smile}/${builder_config[i].output!.energy.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].output?.metal != undefined ? `${builder_config[i].output!.metal.outcome*((lvl)**builder_config[i].output!.metal.koef)}${icotransl_list[builder_config[i].output!.metal.name].smile}/${builder_config[i].output!.metal.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].output?.crystal != undefined ? `${builder_config[i].output!.crystal.outcome*((lvl)**builder_config[i].output!.crystal.koef)}${icotransl_list[builder_config[i].output!.crystal.name].smile}/${builder_config[i].output!.crystal.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].output?.crystal_dirt != undefined ? `${builder_config[i].output!.crystal_dirt.outcome*((lvl)**builder_config[i].output!.crystal_dirt.koef)}${icotransl_list[builder_config[i].output!.crystal_dirt.name].smile}/${builder_config[i].output!.crystal_dirt.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].output?.artefact != undefined ? `${builder_config[i].output!.artefact.outcome*((lvl)**builder_config[i].output!.artefact.koef)}${icotransl_list[builder_config[i].output!.artefact.name].smile}/${builder_config[i].output!.artefact.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].output?.golden != undefined ? `${builder_config[i].output!.golden.outcome*((lvl)**builder_config[i].output!.golden.koef)}${icotransl_list[builder_config[i].output!.golden.name].smile}/${builder_config[i].output!.golden.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].output?.iron != undefined ? `${builder_config[i].output!.iron.outcome*((lvl)**builder_config[i].output!.iron.koef)}${icotransl_list[builder_config[i].output!.iron.name].smile}/${builder_config[i].output!.iron.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].output?.uranium != undefined ? `${builder_config[i].output!.uranium.outcome*((lvl)**builder_config[i].output!.uranium.koef)}${icotransl_list[builder_config[i].output!.uranium.name].smile}/${builder_config[i].output!.uranium.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].output?.oil != undefined ? `${builder_config[i].output!.oil.outcome*((lvl)**builder_config[i].output!.oil.koef)}${icotransl_list[builder_config[i].output!.oil.name].smile}/${builder_config[i].output!.oil.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].output?.gas != undefined ? `${builder_config[i].output!.gas.outcome*((lvl)**builder_config[i].output!.gas.koef)}${icotransl_list[builder_config[i].output!.gas.name].smile}/${builder_config[i].output!.gas.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].output?.coal != undefined ? `${builder_config[i].output!.coal.outcome*((lvl)**builder_config[i].output!.coal.koef)}${icotransl_list[builder_config[i].output!.coal.name].smile}/${builder_config[i].output!.coal.time == 3600000 ? "час": "сутки"} ` : ""}`
        event_logger += ` ${builder_config[i].output?.builder_block != undefined ? `${builder_config[i].output!.builder_block.outcome*((lvl)**builder_config[i].output!.builder_block.koef)}${icotransl_list[builder_config[i].output!.builder_block.name].smile}/${builder_config[i].output!.builder_block.time == 3600000 ? "час": "сутки"} ` : ""}`
    }
}