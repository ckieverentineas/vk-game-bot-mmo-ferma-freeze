const vowels = ["а", "е", "ё", "и", "о", "у", "ы", "э", "ю", "я"];
const consonants = ["б", "в", "г", "д", "ж", "з", "к", "л", "м", "н", "п", "р", "с", "т", "ф", "х", "ц", "ч", "ш", "щ"];
const suffixes = ["ов", "ев", "ёв", "ин", "ын", "их", "ых", "ский", "ская", "цкий", "цкая"];

function generateSyllable(): string {
  // Генерируем случайную комбинацию гласных и согласных звуков
  const vowelIndex = Math.floor(Math.random() * vowels.length);
  const consonantIndex = Math.floor(Math.random() * consonants.length);

  // Комбинируем гласный и согласный звук в слог
  const syllable = `${consonants[consonantIndex]}${vowels[vowelIndex]}`;

  return syllable;
}

function generateName(): string {
  // Генерируем случайное количество слогов для имени
  const syllableCount = Math.floor(Math.random() * 3) + 1;
  let name = "";

  // Создаем имя путем комбинирования случайных слогов
  for (let i = 0; i < syllableCount; i++) {
    name += generateSyllable();
  }

  // Добавляем суффикс "ин" или "ын" для однофамильцев
  if (Math.random() < 0.2) {
    if (name.charAt(name.length - 1) === "в" || name.charAt(name.length - 1) === "н") {
      name += "ин";
    } else {
      name += "ын";
    }
  }

  // Добавляем суффикс "ов" или "ев" для отчества
  if (Math.random() < 0.3) {
    if (name.charAt(name.length - 1) === "в") {
      name += "ов";
    } else {
      name += "ев";
    }
  }

  return name;
}

function generateSurname(): string {
  // Генерируем случайное количество слогов для фамилии
  const syllableCount = Math.floor(Math.random() * 2) + 1;
  let surname = "";

  // Создаем фамилию путем комбинирования случайных слогов
  for (let i = 0; i < syllableCount; i++) {
    surname += generateSyllable();
  }

  // Добавляем суффикс для фамилии
  const suffixIndex = Math.floor(Math.random() * suffixes.length);
  surname += suffixes[suffixIndex];

  return surname;
}

async function Generator_Nickname(): Promise<string> {
    return `${generateName()} ${generateSurname()}`;
}
export default Generator_Nickname