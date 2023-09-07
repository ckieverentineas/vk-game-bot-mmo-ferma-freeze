export const buildin: Builder_Init[] = [
    { 
        builder: "Шахты",
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
        description: "Шахты позволяют истощать ресурсы планет"
    },
    { 
        builder: "Электростанция",
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
        description: 'Электростанция потреБЛЯет преобразует добытый уголь в энергию'
    },
    { 
        builder: "Солнечная электростанция",
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
        description: 'Солнечная электростанция преобразует энергию света в энергию'
    },
    { 
        builder: "Центробанк",
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
        description: 'Центральный банк делает шекели из добытых золотых слитков'
    },
    {
        builder: "Археологический центр", 
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
        description: 'Археологический центр позволяет открывать артефакты, из которых могут выпасть даже площадки к планетам'
    },
    {
        builder: "Лаборатория",
        cost: [
            { name: 'gold', count: 100, koef: 1.3838 },
            { name: 'iron', count: 10, koef: 1.3838 },
        ],
        output: [
            { name: 'energy', outcome: 1, koef: 1.4, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 0.01 }
        ],
        description: 'Лаборатория позволяет производить исследования'
    },
    //"Утилизатор": { price: 100, income: 5, cost: 100, koef_price: 1.3838, koef_income: 1.5, type: 'gold', smile: '💰', description: "Офис является штабом вашего бизнеса и фискирует прибыль в шекелях" },
    {
        builder: "Города",
        cost: [
            { name: 'gold', count: 100, koef: 1.3838 },
            { name: 'iron', count: 10, koef: 1.3838 },
        ],
        input: [
            { name: 'worker', income: 5, koef: 1.4, time: 'none' },
        ],
        output: [
            { name: 'energy', outcome: 1, koef: 1.4, time: 3600000 },
        ],
        require: [
            { name: 'worker', limit: 1, koef: 0.01 }
        ],
        description: 'Города - места где рабочие чилят'
    },
    {
        builder: "Склад",
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
        description: 'Склад - хранилище для добытых ресурсов на планете'
    },
    //"Фабрика": { price: 100, income: 5, cost: 100, koef_price: 1.3838, koef_income: 1.5, type: 'energy', smile: '⚡', description: "Электростанция является источником энергии для вашего бизнеса в виде энергии" }
]

export interface Builder_Init {
    builder: string;
    cost: Cost[];
    input?: Input[];
    output?: Output[];
    require: Require[];
    description: string;
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