import { HearManager } from "@vk-io/hear";
import { chat_id, root, vk } from "./index";
import { IQuestionMessageContext } from "vk-io-question";
import prisma from "./module/prisma";
import { Analyzer, Corporation, User } from "@prisma/client";


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
        let users = 'Рейтинг по добытой энергии\n\n'
        let counter = 1
        let user_me = null
        for (const user of await prisma.analyzer.findMany({ orderBy: { energy: 'desc' }, include: { user: true } })) {
            if (counter <= 10) {
                users += `${counter} - ${user.user.name.slice(0, 20)} --> ${user.energy.toFixed(2)}⚡\n`
            }
            if (user.user.idvk == context.senderId) { user_me = `\n${counter} - @id${user.user.idvk}(${user.user.name.slice(0, 20)}) --> ${user.energy.toFixed(2)}⚡`}
            counter++
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
        users += user_me
        await context.send(`${users}`)
    })
    hearManager.hear(/стат -g|Стат -g/gm, async (context: any) => {
        let users = 'Рейтинг по добытым шекелям\n\n'
        let counter = 1
        let user_me = null
        for (const user of await prisma.analyzer.findMany({ orderBy: { gold: 'desc' }, include: { user: true } })) {
            if (counter <= 10) {
                users += `${counter} - ${user.user.name.slice(0, 20)} --> ${user.gold.toFixed(2)}💰\n`
            }
            if (user.user.idvk == context.senderId) { user_me = `\n${counter} - @id${user.user.idvk}(${user.user.name.slice(0, 20)}) --> ${user.gold.toFixed(2)}💰`}
            counter++
        }
        users += user_me
        await context.send(`${users}`)
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
            const target_list = ['gold', 'energy']
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
    hearManager.hear(/!чиню/, async (context) => {
        if (context.isOutbox == false && root.includes(String(context.senderId)) && context.text) {
            for (const builder of await prisma.builder.findMany({})) {
                if (builder.name == "Офис") {
                    if (builder.type != 'gold') {
                        const data = await prisma.builder.update({ where: { id: builder.id }, data: { type: "gold" } })
                        await context.send(`Офис ${builder.id} меняет тип добычи с ${builder.type} на ${data.type}`)
                    } 
                }
                if (builder.name == "Электростанция") {
                    if (builder.type != 'energy') {
                        const data = await prisma.builder.update({ where: { id: builder.id }, data: { type: "energy" } })
                        await context.send(`Электростанция ${builder.id} меняет тип добычи с ${builder.type} на ${data.type}`)
                    } 
                }
            }
            await context.send(`Починка прошла успешно`)
        }
    })
    hearManager.hear(/передать/gm, async (context: any) => {
        if ((context.forwards[0]?.senderId || context.replyMessage?.senderId) && context.text.split(' ').length == 3 && context.peerType == 'chat') {
            const target = context.forwards[0]?.senderId || context.replyMessage?.senderId
            if (!target) { return }
            const user_from: User | null = await prisma.user.findFirst({ where: { idvk: context.senderId } })
            const user_to: User | null = await prisma.user.findFirst({ where: { idvk: target } })
            if ( !user_from || !user_to) { await context.send(`Вы или получатель шекелей не зарегестрированы!`); return }
            if ( user_from?.idvk == user_to?.idvk) { await context.send(`Самому себе нельзя передавать!`); return }
            const [cmd, value, action] = context.text.split(' ');
            const operation_list = ['шекелей', 'шекели', 'шекель']
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
                    context.send(`💰 Транзакция шекелей в сумме ${parseFloat(value)} успешно завершена от ${user_froms.name} к ${user_tos.name}K`)
                    vk.api.messages.send({ peer_id: user_tos.idvk, random_id: 0, message: `💰 Ваш счет увеличился с ${user_to.gold.toFixed(2)} до ${user_tos.gold.toFixed(2)}, отправитель @id${user_from.idvk}(${user_from.name})` })
                    vk.api.messages.send({ peer_id: user_froms.idvk, random_id: 0, message: `💰 Ваш счет уменшилься с ${user_from.gold.toFixed(2)} до ${user_froms.gold.toFixed(2)}, при передачи средств к @id${user_to.idvk}(${user_to.name})` })
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
        if (context.peerType == 'chat') {
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
                        context.send(`Поздравляем с выходом на мировую арену новой корпорации: ${corp.name}`)
                    }
                }
            }
        }
    })
    hearManager.hear(/!вступить/gm, async (context: any) => {
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
}