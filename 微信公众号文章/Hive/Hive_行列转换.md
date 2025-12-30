# Hive行转列和列转行函数详解

## 【问题】
行转列和列转行函数

## 【答案】

### 快速回答（3-5分钟总结）

**行转列和列转行是SQL数据处理中的重要技巧：**

1. **行转列（行转宽）**：将多行数据转换为多列显示
   - 主要方法：`CASE WHEN + 聚合函数`、`PIVOT`函数
   - 适用场景：报表生成、数据透视分析

2. **列转行（宽转窄）**：将多列数据转换为多行显示
   - 主要方法：`UNION ALL`、`UNPIVOT`函数
   - 适用场景：数据标准化、ETL处理

3. **核心原理**：
   - 行转列：通过条件聚合将不同行的值分配到不同列
   - 列转行：通过联合查询将不同列的值合并到同一列

### 详细解释

#### 1. 行转列（行转宽）实现方法

**方法一：使用 CASE WHEN + 聚合函数（通用方法）**

```sql
-- 示例数据：销售数据
CREATE TABLE sales (
    year INT,
    quarter VARCHAR(10),
    amount DECIMAL(10,2)
);

INSERT INTO sales VALUES 
(2023, 'Q1', 1000),
(2023, 'Q2', 1500),
(2023, 'Q3', 1200),
(2023, 'Q4', 1800),
(2024, 'Q1', 1100),
(2024, 'Q2', 1600);

-- 行转列：将季度转为列
SELECT 
    year,
    SUM(CASE WHEN quarter = 'Q1' THEN amount ELSE 0 END) AS Q1,
    SUM(CASE WHEN quarter = 'Q2' THEN amount ELSE 0 END) AS Q2,
    SUM(CASE WHEN quarter = 'Q3' THEN amount ELSE 0 END) AS Q3,
    SUM(CASE WHEN quarter = 'Q4' THEN amount ELSE 0 END) AS Q4,
    SUM(amount) AS total
FROM sales
GROUP BY year;
```

**方法二：使用 PIVOT 函数（部分数据库支持）**

```sql
-- SQL Server
SELECT *
FROM sales
PIVOT (
    SUM(amount)
    FOR quarter IN ([Q1], [Q2], [Q3], [Q4])
) AS pivot_table;

-- Oracle
SELECT *
FROM sales
PIVOT (
    SUM(amount)
    FOR quarter IN ('Q1' AS Q1, 'Q2' AS Q2, 'Q3' AS Q3, 'Q4' AS Q4)
);
```

**复杂示例：多列行转列**

```sql
-- 员工技能表
CREATE TABLE employee_skills (
    emp_id INT,
    emp_name VARCHAR(50),
    skill_type VARCHAR(20),
    skill_level VARCHAR(10)
);

INSERT INTO employee_skills VALUES
(1, '张三', '编程', '高级'),
(1, '张三', '数据库', '中级'),
(1, '张三', '沟通', '初级'),
(2, '李四', '编程', '中级'),
(2, '李四', '设计', '高级');

-- 将技能类型转为列
SELECT 
    emp_id,
    emp_name,
    MAX(CASE WHEN skill_type = '编程' THEN skill_level END) AS 编程,
    MAX(CASE WHEN skill_type = '数据库' THEN skill_level END) AS 数据库,
    MAX(CASE WHEN skill_type = '沟通' THEN skill_level END) AS 沟通,
    MAX(CASE WHEN skill_type = '设计' THEN skill_level END) AS 设计
FROM employee_skills
GROUP BY emp_id, emp_name;
```

#### 2. 列转行（宽转窄）实现方法

**方法一：使用 UNION ALL（通用方法）**

```sql
-- 假设有宽表
CREATE TABLE sales_wide (
    year INT,
    Q1 DECIMAL(10,2),
    Q2 DECIMAL(10,2),
    Q3 DECIMAL(10,2),
    Q4 DECIMAL(10,2)
);

INSERT INTO sales_wide VALUES (2023, 1000, 1500, 1200, 1800);

-- 列转行
SELECT year, 'Q1' AS quarter, Q1 AS amount FROM sales_wide
UNION ALL
SELECT year, 'Q2' AS quarter, Q2 AS amount FROM sales_wide
UNION ALL
SELECT year, 'Q3' AS quarter, Q3 AS amount FROM sales_wide
UNION ALL
SELECT year, 'Q4' AS quarter, Q4 AS amount FROM sales_wide
ORDER BY year, quarter;
```

**方法二：使用 UNPIVOT 函数（部分数据库支持）**

```sql
-- SQL Server
SELECT year, quarter, amount
FROM sales_wide
UNPIVOT (
    amount FOR quarter IN (Q1, Q2, Q3, Q4)
) AS unpivot_table;

-- Oracle
SELECT year, quarter, amount
FROM sales_wide
UNPIVOT (
    amount FOR quarter IN (Q1 AS 'Q1', Q2 AS 'Q2', Q3 AS 'Q3', Q4 AS 'Q4')
);
```

#### 3. 动态行转列处理

当列数不确定时，可以使用动态SQL：

```sql
-- SQL Server 动态PIVOT示例
DECLARE @columns NVARCHAR(MAX), @sql NVARCHAR(MAX);

-- 获取所有季度值
SELECT @columns = COALESCE(@columns + ',', '') + QUOTENAME(quarter)
FROM (SELECT DISTINCT quarter FROM sales) AS quarters;

-- 构建动态SQL
SET @sql = '
SELECT year, ' + @columns + '
FROM sales
PIVOT (
    SUM(amount)
    FOR quarter IN (' + @columns + ')
) AS pivot_table';

EXEC sp_executesql @sql;
```

#### 4. 在Hive中的实现

**Hive行转列示例：**

```sql
-- Hive中使用CASE WHEN实现行转列
SELECT 
    year,
    SUM(CASE WHEN quarter = 'Q1' THEN amount ELSE 0 END) AS Q1,
    SUM(CASE WHEN quarter = 'Q2' THEN amount ELSE 0 END) AS Q2,
    SUM(CASE WHEN quarter = 'Q3' THEN amount ELSE 0 END) AS Q3,
    SUM(CASE WHEN quarter = 'Q4' THEN amount ELSE 0 END) AS Q4
FROM sales
GROUP BY year;
```

**Hive列转行示例：**

```sql
-- Hive中使用UNION ALL实现列转行
SELECT year, 'Q1' AS quarter, Q1 AS amount FROM sales_wide
UNION ALL
SELECT year, 'Q2' AS quarter, Q2 AS amount FROM sales_wide
UNION ALL  
SELECT year, 'Q3' AS quarter, Q3 AS amount FROM sales_wide
UNION ALL
SELECT year, 'Q4' AS quarter, Q4 AS amount FROM sales_wide;
```

#### 5. 方法选择指南

| 操作 | 主要方法 | 适用数据库 | 性能特点 |
|------|----------|------------|----------|
| 行转列 | CASE WHEN + 聚合函数 | 所有数据库 | 通用性好，性能稳定 |
| 行转列 | PIVOT | SQL Server, Oracle | 语法简洁，性能优秀 |
| 列转行 | UNION ALL | 所有数据库 | 通用性好，易理解 |
| 列转行 | UNPIVOT | SQL Server, Oracle | 语法简洁，性能优秀 |

**选择建议：**
1. **通用性优先**：使用CASE WHEN和UNION ALL，适用于所有数据库
2. **性能优先**：在支持的数据库中使用PIVOT/UNPIVOT
3. **动态处理**：列数不确定时使用动态SQL构建
4. **数据量考虑**：大数据量时优先考虑性能和资源消耗

## 【引流引导】

掌握了行转列和列转行的核心技巧，但在实际大数据开发中还会遇到更多复杂的数据处理场景。想要系统提升SQL和大数据技能吗？

**扫码体验AI面试助手小程序**，获取：
- 📚 完整的Hive函数使用指南
- 💡 SQL优化最佳实践案例  
- 🎯 针对性的面试题目练习
- 🤖 AI智能答疑，随时解决技术难题

让AI助手陪你一起，轻松应对各种数据处理挑战！