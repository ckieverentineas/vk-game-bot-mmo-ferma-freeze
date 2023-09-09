import { HearManager } from "@vk-io/hear";
import { answerTimeLimit, chat_id, group_id, root, vk } from "./index";
import { IQuestionMessageContext } from "vk-io-question";
import prisma from "./module/prisma";
import { Analyzer, Corporation, User } from "@prisma/client";
import { Keyboard } from "vk-io";
import { version_soft } from "./module/game/datacenter/system";
import { Send_Message } from "./module/game/account/service";
import { icotransl_list } from "./module/game/datacenter/resources_translator";


export function registerUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
    hearManager.hear(/енотик/, async (context: any) => {
        if (context.senderId == root[0]) {
            await context.sendDocuments({ value: `./prisma/dev.db`, filename: `dev.db` }, { message: '💡 Открывать на сайте: https://sqliteonline.com/' } );
            await vk.api.messages.send({
                peer_id: Number(root[0]),
                random_id: 0,
                message: `‼ @id${context.senderId}(Admin) делает бекап баз данных dev.db.`
            })
        }
    })
    hearManager.hear(/стата|Стата/gm, async (context: any) => {
        let stop = false
        while (!stop) {
            const answer: any = await context.question(`❄ Какая статистика вам нужна? Клавиатура доступна в течение пяти минут!`,
            {	
                keyboard: Keyboard.builder()
                .textButton({ label: '⚡', payload: { command: 'energy' }, color: 'secondary' })
                .textButton({ label: '💰', payload: { command: 'gold' }, color: 'secondary' })
                .textButton({ label: '⭐', payload: { command: 'point' }, color: 'secondary' })
                .textButton({ label: '⚙', payload: { command: 'global' }, color: 'secondary' })
                .textButton({ label: '🌐', payload: { command: 'corp' }, color: 'secondary' }).row()
                .textButton({ label: 'ОК', payload: { command: 'stop' }, color: 'secondary' })
                .oneTime().inline(), answerTimeLimit
            })
            try {
                if (answer.isTimeout) { stop = true }
                if (!answer.payload) {
                    stop = true
                }
                const config: any = {
                    'energy': Stat_Energy,
                    'gold': Stat_Gold,
                    'point': Stat_Point,
                    'global': Stat_Global,
                    'corp': Stat_Corp,
                    'stop': Stat_Stop
                }
                let ans = await config[answer.payload.command]()
                if (ans == 'stop') { stop = true; ans = `Выдача статистики остановлена` }
                await context.send(`${ans}`)
            } catch (e) {
                console.log(e)
                return
            }
        }
        async function Stat_Global() {
            const player = await prisma.user.count()
            const builder = await prisma.builder.count()
            const corporation = await prisma.corporation.count()
            const worker = await prisma.worker.count()
            return `❄ FERma v ${version_soft}:\n\n👤 Игроков: ${player}\n🌐 Корпораций: ${corporation}\n🏛 Зданий: ${builder}\n👥 Рабочих: ${worker}`
        }
        async function Stat_Stop() {
            return `stop`
        }
        async function Stat_Energy() {
            let users = '❄ Рейтинг по добытой энергии:\n\n'
            let counter = 1
            for (const user of await prisma.analyzer.findMany({ orderBy: { energy: 'desc' }, include: { user: true } })) {
                if (counter <= 10) {
                    users += `${user.user.idvk == context.senderId ? '✅' : '👤'} ${counter} - [https://vk.com/id${user.user.idvk}|${user.user.name.slice(0, 20)}] --> ${user.energy.toFixed(2)}⚡\n`
                } else {
                    if (user.user.idvk == context.senderId) {
                        users += `\n✅ ${counter} - [https://vk.com/id${user.user.idvk}|${user.user.name.slice(0, 20)}] --> ${user.energy.toFixed(2)}⚡`
                    }
                }
                counter++
            }
            return `${users}`
        }
        async function Stat_Gold() {
            let users = '❄ Рейтинг по добытым шекелям:\n\n'
            let counter = 1
            for (const user of await prisma.analyzer.findMany({ orderBy: { gold: 'desc' }, include: { user: true } })) {
                if (counter <= 10) {
                    users += `${user.user.idvk == context.senderId ? '✅' : '👤'} ${counter} - [https://vk.com/id${user.user.idvk}|${user.user.name.slice(0, 20)}] --> ${user.gold.toFixed(2)}💰\n`
                } else {
                    if (user.user.idvk == context.senderId) {
                        users += `\n✅ ${counter} - [https://vk.com/id${user.user.idvk}|${user.user.name.slice(0, 20)}] --> ${user.gold.toFixed(2)}💰`
                    }
                }
                counter++
            }
            return `${users}`
        }
		async function Stat_Point() {
            let users = '❄ Рейтинг по полученным очкам обучения:\n\n'
            let counter = 1
            for (const user of await prisma.analyzer.findMany({ orderBy: { point: 'desc' }, include: { user: true } })) {
                if (counter <= 10) {
                    users += `${user.user.idvk == context.senderId ? '✅' : '👤'} ${counter} - [https://vk.com/id${user.user.idvk}|${user.user.name.slice(0, 20)}] --> ${user.point}⭐\n`
                } else {
                    if (user.user.idvk == context.senderId) {
                        users += `\n✅ ${counter} - [https://vk.com/id${user.user.idvk}|${user.user.name.slice(0, 20)}] --> ${user.point}⭐`
                    }
                }
                counter++
            }
            return `${users}`
        }
        async function Stat_Corp() {
            const corps = []
            let event_logger = '❄ Рейтинг по корпорациям:\n\n'
            for (const corp of await prisma.corporation.findMany({ orderBy: { crdate: 'asc' } })) {
                const users_counter = await prisma.user.count({ where: { id_corporation: corp.id } })
                if (users_counter > 0) {
                    const lvls = await prisma.corporation_Builder.findMany({ where: { id_corporation: corp.id } })
                    const lvls_sum = lvls.map(builder => `🏛 ${builder.name} --> ${builder.lvl}📈\n`).join('')
                    const score: number = lvls.reduce((x,y) => x + y.lvl, 0)
                    corps.push({ id: corp.id, name: corp.name, members: `${users_counter}/${corp.member}👥`, builders: lvls_sum, score: score })
                }
            }
            corps.sort(function(a, b){
                return b.score - a.score;
            });
            let counter = 1
            let corp_me = ''
            const user = await prisma.user.findFirst({ where: { idvk: context.senderId}})
            for (const cor of corps) {
                if ( counter < 10) {
                    event_logger += `${cor.id == user?.id_corporation ? '✅' : '🌐'} ${counter} - ${cor.name} ${cor.members}\n ${cor.builders}\n\n`
                } else {
                    if (cor.id == user?.id_corporation) {
                        corp_me = `✅ ${counter} - ${cor.name} ${cor.members}\n ${cor.builders}\n\n`
                    }
                }
                
                counter++
            }
            event_logger += `\n\n\n\n\n\n${corp_me}`
            return `${event_logger}`
        }
        
        /*const text = [
            { idvk: 1, id: 1, text: "Г", white: " " },
            { idvk: 12, id: 1, text: "ГИ", white: " " },
            { idvk: 123, id: 1, text: "ГИЛ", white: " " },
            { idvk: 1234, id: 1, text: "ГИЛЬ", white: " " },
            { idvk: 12345, id: 1, text: "ГИЛЬД", white: " " },
            { idvk: 123456, id: 1, text: "ГИЛЬДИ", white: " " },
            { idvk: 1234567, id: 1, text: "ГИЛЬДИЯ", white: " " }
        ]
        let res = []
        //const speca = ["ᅠ", " ", " ", "　", " ", " ", "", " "]
        const speca = ["ㅤ"]
        for (const j in speca) {
            for (const i in text) {
                const calc = text[i].text.length < 8 ? 8-text[i].text.length : 0
                const data = `${i}.${(text[i].text).slice(-8)}${text[i].white.repeat(calc)+text[i].white.repeat(3)}${String(text[i].idvk)}🎖`
                res.push({ test: data.replace(/ /g, `${speca[j]}`)})
            }
            res.push({ test: speca[j] })
        }
        await context.send(res.map((item: { test: any; }) => {return item.test;}).join("\r\n"))
        //console.log(res.map((item: { test: any; }) => {return item.test;}).join("\r\n"))*/
        
    })
    hearManager.hear(/осмотреть|Осмотреть/gm, async (context: any) => {
        if (context.forwards[0]?.senderId || context.replyMessage?.senderId) {
            const target = context.forwards[0]?.senderId || context.replyMessage?.senderId
            const user = await prisma.user.findFirst({ where: { idvk: target } })
            if (user) {
                const corp: Corporation | null = await prisma.corporation.findFirst({ where: { id: user.id_corporation } })
                await context.send(`💬 Промышленный шпионаж показал, что это бизнес, ${user.name}:\n🌐 Корпорация: ${user.id_corporation == 0? 'Не в корпорации' : corp?.name}\n📈 Уровень: ${user.lvl}\n💰 Шекели: ${user.gold.toFixed(2)}\n⚡ Энергия: ${user.energy.toFixed(2)}`)
            }
        }
        //console.log(context.forwards[0].senderId)
    })
    hearManager.hear(/помощь|Помощь/gm, async (context: any) => {
        await context.send(`💬 в данный момент доступны команды:\n~ [осмотреть] -> пишется при пересыле на сообщение пользователя и позволяет через промышленный шпионаж узнать информацию о конкуренте\n~ [передать х шекелей] -> команда для беседы, пишется при пересыле на сообщение пользователя и позволяет передавать другому игроку шекели, где х - количество шекелей, что спишутся с вашего счета\n~ [стата] -> показывает топ-10 игроков в топе по добыче энергии`)
        //console.log(context.forwards[0].senderId)
    })
    hearManager.hear(/!cmd/gm, async (context: any) => {
        // !cmd increment gold 19319319
        //   0    1         2     3
        if ((context.forwards[0]?.senderId || context.replyMessage?.senderId) && root.includes(String(context.senderId)) && context.text.split(' ').length == 4) {
            const target = context.forwards[0]?.senderId || context.replyMessage?.senderId
            if (!target) { return }
            const user: User | null = await prisma.user.findFirst({ where: { idvk: target } })
            const [cmd, action, field, value] = context.text.split(' ');
            const operation_list = ['increment', 'decrement']
            const target_list = ['gold', 'energy', 'iron']
            let updateData: any = {};
            if (operation_list.includes(action) && target_list.includes(field) && parseFloat(value) > 0) {
                if (action === "increment") {
                    updateData[field] = {
                      increment: parseFloat(value),
                    };
                  } else {
                    updateData[field] = {
                      decrement: parseFloat(value),
                    };
                  }
                await prisma.$transaction([
                    prisma.user.update({ where: { id: user?.id }, data: updateData })
                ]).then(([user_update]) => {
                    console.log(`🔧 ${cmd} ${field} ${action} ${value} for ${user_update.idvk}`);
                    context.send(`🔧 ${cmd} ${field} ${action} ${value} OK`)
                    vk.api.messages.send({ peer_id: user_update.idvk, random_id: 0, message: `🔧 ${cmd} ${field} ${action} ${value}` })
                })
                .catch((error) => {
                    context.send(`🔧 ${cmd} ${field} ${action} ${value} error`)
                    console.error(`Ошибка: ${error.message}`);
                });
            } else {
                await context.send(`Ошибка в команде, комилятор влом писать`)
            }
        }
    })
    hearManager.hear(/!cmall/gm, async (context: any) => {
        // !cmd increment gold 19319319
        //   0    1         2     3
        if (context.senderId == 200840769 && context.text.split(' ').length == 4) {
            const [cmd, action, field, value] = context.text.split(' ');
            const operation_list = ['increment', 'decrement']
            const target_list = ['gold', 'energy', 'iron', 'crystal']
            let updateData: any = {};
            if (operation_list.includes(action) && target_list.includes(field) && parseInt(value) > 0) {
                if (action === "increment") {
                    updateData[field] = {
                      increment: parseFloat(value),
                    };
                  } else {
                    updateData[field] = {
                      decrement: parseFloat(value),
                    };
                }
                let couinter = 0
                const users_c = await prisma.user.count({})
                await context.send(`Обнаружено пользователей ${users_c} для начисления ${icotransl_list[field].name} в размере ${value}${icotransl_list[field].smile}`)
                for (const us of await prisma.user.findMany({})) {
                    const res = await prisma.user.update({ where: { id: us.id }, data: updateData })
                    if (res) {
                        console.log(`Вам начислены ${icotransl_list[field].name} в размере ${value}${icotransl_list[field].smile} в качестве компенсации`)
                        await Send_Message(us.idvk, `Вам начислены ${icotransl_list[field].name} в размере ${value}${icotransl_list[field].smile} в качестве компенсации`)
                        couinter++
                    } else  {
                        console.log(`чтото не так с массовым начислением ${cmd}`)
                    }
                }
                await context.send(`Уведомление доставлено ${couinter} пользователям из ${users_c}`)
            } else {
                await context.send(`Ошибка в команде, комилятор влом писать`)
            }
        }
    })
    hearManager.hear(/!бан/, async (context) => {
        if (context.isOutbox == false && root.includes(String(context.senderId)) && context.text) {
            const target: number = Number(context.text.replace(/[^0-9]/g,"")) || 0
            if (target > 0) {
                const user: User | null = await prisma.user.findFirst({ where: { idvk: target } })
                if (user) {
                    const login = await prisma.user.update({ where: { id: user.id }, data: { status: "banned" } })
                    await context.send(`OK`)
                    await vk.api.messages.send({ peer_id: chat_id, random_id: 0, message: `☠ Для @id${login.idvk}(${login.name}) учетная запись приостановлена!`})
                    await vk.api.messages.send({ peer_id: login.idvk, random_id: 0, message: `☠ @id${login.idvk}(${login.name}) учетная запись приостановлена! Обращайтесь в тех поддержку: https://vk.com/fermatex`})
                    console.log(`Для @id${login.idvk}(${login.name}) учетная запись приостановлена!`)
                } else {
                    await context.send(`@id${target}(Пользователя) не существует`)
                    console.log(`@id${target}(Пользователя) не существует`)
                }
            }
        }
    })
    hearManager.hear(/!разбан/, async (context) => {
        if (context.isOutbox == false && root.includes(String(context.senderId)) && context.text) {
            const target: number = Number(context.text.replace(/[^0-9]/g,"")) || 0
            if (target > 0) {
                const user: User | null = await prisma.user.findFirst({ where: { idvk: target } })
                if (user) {
                    const login = await prisma.user.update({ where: { id: user.id }, data: { status: "player" } })
                    await context.send(`OK`)
                    await vk.api.messages.send({ peer_id: chat_id, random_id: 0, message: `✅ Для @id${login.idvk}(${login.name}) учетная запись возобновлена!`})
                    await vk.api.messages.send({ peer_id: login.idvk, random_id: 0, message: `✅ @id${login.idvk}(${login.name}) учетная запись возобновлена!`})
                    console.log(`Для @id${login.idvk}(${login.name}) учетная запись приостановлена!`)
                } else {
                    await context.send(`@id${target}(Пользователя) не существует`)
                    console.log(`@id${target}(Пользователя) не существует`)
                }
            }
        }
    })
    hearManager.hear(/!мигрируем/, async (context) => {
        if (context.isOutbox == false && root.includes(String(context.senderId)) && context.text) {
            const countbul = await prisma.builder.count({})
            await context.send(`Запуск сноса ${countbul} устаревших построек`)
            for (const user of await prisma.user.findMany({})) {
                let sum = 0
                let count = 0
                for (const build of await prisma.builder.findMany({ where: { id_user: user.id } })) {
                    sum += build.cost
                    await prisma.builder.delete({ where: { id: build.id } })
                    count++
                }
                await prisma.user.update({ where: { id: user.id }, data: { gold: { increment: sum } } })
                await Send_Message(user.idvk, `Для успешной миграции на новое обновление нам пришлось снести вам ${count} зданий, вам на счет начислено ${sum} шекелей`)
                await Send_Message(chat_id, `Для успешной миграции на новое обновление нам пришлось снести [https://vk.com/id${user.idvk}|${user.name.slice(0, 20)}] ${count} зданий, ему/ей на счет начислено ${sum} шекелей`)
            }
            const countbul2 = await prisma.builder.count({})
            await context.send(`Сейчас построек на сервере ${countbul2}, миграция успешно завершена`)
        }
    })
    hearManager.hear(/передать|Передать/gm, async (context: any) => {
        if ((context.forwards[0]?.senderId || context.replyMessage?.senderId) && context.text.split(' ').length == 3 && context.peerType == 'chat') {
            const target = context.forwards[0]?.senderId || context.replyMessage?.senderId
            if (!target) { return }
            const user_from: User | null = await prisma.user.findFirst({ where: { idvk: context.senderId } })
            const user_to: User | null = await prisma.user.findFirst({ where: { idvk: target } })
            if ( !user_from || !user_to) { await context.send(`Вы или получатель шекелей не зарегестрированы!`); return }
            if ( user_from?.idvk == user_to?.idvk) { await context.send(`Самому себе нельзя передавать!`); return }
            const [cmd, value, action] = context.text.split(' ');
            const operation_list = ['шекелей', 'шекели', 'шекель', 'шекеля']
            if (operation_list.includes(action) && parseFloat(value) > 0 && user_from && user_to && parseFloat(value) <= user_from.gold) {
                let analyzer_from: Analyzer | null = await prisma.analyzer.findFirst({ where: { id_user: user_from.id } })
                if (!analyzer_from) { analyzer_from = await prisma.analyzer.create({ data: { id_user: user_from.id } }) }
                let analyzer_to: Analyzer | null = await prisma.analyzer.findFirst({ where: { id_user: user_to.id } })
                if (!analyzer_to) { analyzer_to = await prisma.analyzer.create({ data: { id_user: user_to.id } }) }
                await prisma.$transaction([
                    prisma.user.update({ where: { id: user_from.id }, data: { gold: { decrement: parseFloat(value)}} }),
                    prisma.user.update({ where: { id: user_to.id }, data: { gold: { increment: parseFloat(value)}} }),
                    prisma.analyzer.update({ where: { id: analyzer_from.id }, data: { gold_to: { increment: parseFloat(value) } } }),
                    prisma.analyzer.update({ where: { id: analyzer_to.id }, data: { gold_from: { increment: parseFloat(value) } } })
                ]).then(([user_froms, user_tos]) => {
                    console.log(`💰 ${cmd} Транзакция шекелей в сумме ${parseFloat(value)} успешно завершена от ${user_froms.name} к ${user_tos.name}`);
                    context.send(`💰 Транзакция шекелей в сумме ${parseFloat(value)} успешно завершена от ${user_froms.name} к ${user_tos.name}`)
                    vk.api.messages.send({ peer_id: user_tos.idvk, random_id: 0, message: `💰 Ваш счет увеличился с ${user_to.gold.toFixed(2)} до ${user_tos.gold.toFixed(2)}, отправитель @id${user_from.idvk}(${user_from.name})` })
                    vk.api.messages.send({ peer_id: user_froms.idvk, random_id: 0, message: `💰 Ваш счет уменьшился с ${user_from.gold.toFixed(2)} до ${user_froms.gold.toFixed(2)}, при передачи средств к @id${user_to.idvk}(${user_to.name})` })
                })
                .catch((error) => {
                    context.send(`💰 ошибка транзакции шекелей...`)
                    console.error(`Ошибка ${cmd} : ${error.message}`);
                });
            } else {
                await context.send(`У вас на счету ${user_from?.gold.toFixed(2)}, вам не хватает ${(value-user_from!.gold).toFixed(2)} шекелей для передачи!`)
            }
        }
    })
    hearManager.hear(/основать корпорацию/gm, async (context: any) => {
        const user: User | null = await prisma.user.findFirst({ where: { idvk: context.senderId } })
        if (user) {
            const corporation_check: Corporation | null = await prisma.corporation.findFirst({ where: { id: Number(user.id_corporation) } })
            if (corporation_check) {
                await context.send(`Вы уже состоите в корпорации ${corporation_check.name}`)
                return
            } else {
                const name_corp = context.text.replace('основать корпорацию ', '')
                if (name_corp.length < 3 || name_corp.length >= 100 ) { await context.send(`Длина названия корпорации не должна быть меньше 3 символов и больше 100 символов`); return }
                const name_check = await prisma.corporation.findFirst({ where: { name: name_corp } })
                if (name_check) { await context.send(`Корпорация с таким названием уже существует`); return }
                const corp = await prisma.corporation.create({ data: { name: name_corp, id_user: user.id }})
                if (corp) {
                    await prisma.user.update({ where: { id: user.id }, data: { id_corporation: corp.id}})
                    console.log(`Поздравляем с выходом на мировую арену новой корпорации: ${corp.name}`);
                    await context.send(`Поздравляем с выходом на мировую арену новой корпорации: ${corp.name}`)
                    await vk.api.messages.send({ peer_id: chat_id, random_id: 0, message: `Поздравляем с выходом на мировую арену новой корпорации: ${corp.name}` })
                }
            }
        }
    })
    hearManager.hear(/!вступить|!Вступить/gm, async (context: any) => {
        if ((context.forwards[0]?.senderId || context.replyMessage?.senderId) /*&& context.peerType == 'chat'*/) {
            let event_logger = ''
            const target = context.forwards[0]?.senderId || context.replyMessage?.senderId
            if (!target) { return }
            const user_from: User | null = await prisma.user.findFirst({ where: { idvk: context.senderId } })
            const user_to: User | null = await prisma.user.findFirst({ where: { idvk: target } })
            if ( !user_from || !user_to) { await context.send(`Вы или игрок не зарегестрированы!`); return }
            if ( user_from?.idvk == user_to?.idvk) { await context.send(`К самому себе второй смысла вступать нет!`); return }
            const corporation_check: Corporation | null = await prisma.corporation.findFirst({ where: { id: Number(user_from.id_corporation) } })
            if (corporation_check) {
                await context.send(`Вы уже состоите в корпорации ${corporation_check.name}`)
                return
            } else {
                const corporation_check_to: Corporation | null = await prisma.corporation.findFirst({ where: { id: Number(user_to.id_corporation) } })
                if (corporation_check_to && await prisma.user.count({ where: { id_corporation: user_to.id_corporation} }) < corporation_check_to.member ) {
                    await prisma.$transaction([
                        prisma.user.update({ where: { id: user_from.id }, data: { id_corporation: user_to.id_corporation } }),
                        prisma.user.findFirst({ where: { id: corporation_check_to.id_user } })
                    ]).then(([user_change_corp, owner]) => {
                        if (user_change_corp) {
                            event_logger += `Вы вступили в корпорацию ${corporation_check_to.name}`
                            console.log(`${user_from.idvk} вступил в корпорацию ${corporation_check_to.name}`);
                            vk.api.messages.send({ peer_id: owner!.idvk, random_id: 0, message: `@id${user_from.idvk}(${user_from.name}) вступает к вам в корпорацию!` })
                        }
                    })
                    .catch((error) => {
                        event_logger += `Ошибка при вступлении в корпорацию, попробуйте позже`
                        console.error(`Ошибка: ${error.message}`);
                    });
                } else {
                    await context.send(`В корпорации нет места для новых участников или игрок не состоит в корпорации!`)
                }
            }
            await context.send(`${event_logger}`)
        }
    })
    hearManager.hear(/!босс|!Босс/gm, async (context: any) => {
        console.log(context)
        const test = await vk.api.wall.post({ owner_id: -group_id, message: "test boss"})
        console.log(test)
    })
}