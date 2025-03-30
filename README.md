# TravelbilityApp

**TravelbilityApp** е студентски проект, който улеснява намирането на обекти за настаняване, със специален фокус върху хора с увреждания.

## Описание

В **TravelbilityApp** потребителите ще могат да се регистрират и след регистрацията ще имат възможността да:
- Публикуват обекти за настаняване, като включват подробности за достъпността и предлаганите услуги;
- Редактират и изтриват обектите, които са публикували.

Всички посетители на сайта ще могат да:
- Разглеждат вече публикуваните обекти за настаняване;
- Филтрират обектите по различни критерии като тип, услуги и достъпност.

## Съдържание

**TravelbilityApp** има публична и частна част.

### Публична част
- **Topbar** – линкове за регистрация ("Sign up"), влизане ("Log in") и добавяне на обект ("List your property");
- **Навигация** – лого и линкове към страниците за обекти за настаняване, нашата мисия и контакт;
- **Начална страница**, включваща секции за "Explore the newest added" и "Find a property according to your needs";
- Страници за вход и регистрация на потребители;
- Страница с всички обекти за настаняване и филтриране по 3 основни категории;
- Страница с детайли за всеки обект.

### Частна част
- **Topbar** – линкове за управление на обекти ("Manage my properties"), излизане ("Sign out") и добавяне на нов обект ("List your property");
- Страница с обекти, публикувани от текущия влязъл потребител;
- Страници с форми за добавяне и редактиране на обекти.

## Структура на проекта

Проектът е разделен на две основни части:

- **Client (Клиентска част)**: Интерфейс на приложението, разработен с ReactJS, JavaScript HTML И CSS;
- **Server (Сървърна част)**: Използван [softuni-practice-server](https://github.com/softuni-practice-server/softuni-practice-server)

## Инструкции за стартиране на проекта

### Изисквания

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/) или [yarn](https://yarnpkg.com/)

### Как да стартирате проекта локално

1. Клонирайте репозиторито:
   ```bash
   git clone https://github.com/johanna-konova/TravelbilityApp.git
   cd TravelbilityApp
   ```
   
2. Инсталирайте зависимостите за клиентската част:
   ```bash
   cd client
   npm install
   ```

3. Стартирайте сървъра:
   ```bash
   cd server
   node server.js
   ```

4. Отворете клиентската част в браузър:
   ```bash
   cd client
   npm run dev
   ```

### Проектът можe да бъде достъпен и от тук - [Travelbility - Travel Without Limits!](https://travelbility-23caa.web.app)

# Използван css template - [TRAVELER Free CSS Template](https://www.free-css.com/free-css-templates/page281/traveler)
