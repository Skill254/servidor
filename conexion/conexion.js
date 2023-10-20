const mysql = require("mysql");
module.exports = {
    db: function () {
        const db = mysql.createPool({
            host: '172.16.251.2',
            user: 'dev.esilva',
            password: 'Esilva2022@',
            database: '',
            multipleStatements: true
        }); //UsuarioEduardo DEV
        return (db)
    },    
}
