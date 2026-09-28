# Backend CHP-Angola — PHP + MySQL

Backend para o formulário de contacto do site CHP-Angola. Preparado para hospedagem **Angoweb (cPanel)**.

## 📋 Requisitos

- PHP 7.4+ (recomendado 8.1+)
- MySQL 5.7+ ou MariaDB 10.3+
- Extensões PHP: `pdo_mysql`, `mbstring`, `json`
- HTTPS ativo (Let's Encrypt no cPanel)

## 🚀 Instalação

### 1. Criar base de dados

No **cPanel → MySQL Databases**:

1. Criar base de dados: `chp_leads`
2. Criar utilizador: `chp_user` com password forte
3. Atribuir todas as permissões ao utilizador na BD

### 2. Criar tabela

No **phpMyAdmin**, importar o ficheiro `sql/schema.sql`.

Ou correr manualmente:

```sql
CREATE TABLE leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150) NOT NULL,
  insurance_type VARCHAR(50),
  message TEXT NOT NULL,
  ip VARCHAR(45),
  user_agent VARCHAR(255),
  contacted TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created (created_at DESC),
  INDEX idx_contacted (contacted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
