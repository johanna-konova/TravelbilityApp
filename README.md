# TravelbilityApp

**TravelbilityApp** is a student project designed to simplify finding accommodation with a special focus on people with disabilities.

## Description

In **TravelbilityApp**, users will be able to register and, after registration, they will be able to:
- Post accommodation properties, including details about accessibility and available services;
- Edit and delete the properties they have posted.

All site visitors will be able to:
- Browse the already posted accommodation properties;
- Filter the properties by various criteria such as type, services, and accessibility.

## Content

**TravelbilityApp** has a public and private part.

### Public Part
- **Topbar** – links for registration ("Sign up"), login ("Log in"), and property listing ("List your property");
- **Navigation** – logo and links to pages for accommodation properties, our mission, and contact;
- **Homepage**, featuring sections for "Explore the newest added" and "Find a property according to your needs";
- Pages for user login and registration;
- A page with all accommodation properties and filters by 3 main categories;
- A page with detailed information for each property.

### Private Part
- **Topbar** – links for managing properties ("Manage my properties"), logging out ("Sign out"), and adding a new property ("List your property");
- A page with properties posted by the currently logged-in user;
- Pages with forms for adding and editing properties.

## Project Structure

The project is divided into two main parts:

- **Client**: The front-end interface of the application, developed with ReactJS, JavaScript, HTML, and CSS;
- **Server**: Uses the [softuni-practice-server](https://github.com/softuni-practice-server/softuni-practice-server)

## Instructions for Running the Project

### Requirements

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### How to Run the Project Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/johanna-konova/TravelbilityApp.git
   cd TravelbilityApp
   ```
   
2. Install dependencies for the client side:
   ```bash
   cd client
   npm install
   ```

3. Start the server:
   ```bash
   cd server
   node server.js
   ```

4. Open the client side in your browser:
   ```bash
   cd client
   npm run dev
   ```

The project is initialized with three test users, which can be used for immediate testing:
- peter@abv.bg : 123456
- george@abv.bg : 123456
- admin@abv.bg : admin

### The project can also be accessed here - [Travelbility - Travel Without Limits!](https://travelbility-23caa.web.app)

## Used CSS Template
[TRAVELER Free CSS Template](https://www.free-css.com/free-css-templates/page281/traveler)

## License
This project is licensed under the **MIT** License. For more details, please refer to the [LICENSE](LICENSE) file.
