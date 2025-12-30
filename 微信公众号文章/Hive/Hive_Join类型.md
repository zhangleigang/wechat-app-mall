# 内连接、左外连接、右外连接的区别

## 【问题】
内连接、左外连接、右外连接的区别

## 【答案】

### 快速回答（3-5分钟总结）

**核心思想总结：**
- **内连接（INNER JOIN）**：求的是"**交集**"。只返回两个表中都匹配的记录。
- **左外连接（LEFT OUTER JOIN）**：以左表为"**基准**"。返回左表的全部记录，以及右表中与之匹配的记录。如果右表没有匹配，右表部分用 `NULL` 填充。
- **右外连接（RIGHT OUTER JOIN）**：以右表为"**基准**"。返回右表的全部记录，以及左表中与之匹配的记录。如果左表没有匹配，左表部分用 `NULL` 填充。

**简单记忆法：**
- 内连接 = 两表的交集
- 左连接 = 左表全部 + 右表匹配部分
- 右连接 = 右表全部 + 左表匹配部分

### 详细解释

#### 举例说明

我们创建两个简单的表来演示：

**员工表 (employees)**

| id | name  | department_id |
|----|-------|---------------|
| 1  | 张三  | 1             |
| 2  | 李四  | 2             |
| 3  | 王五  | `NULL`        |
| 4  | 赵六  | 3             |

**部门表 (departments)**

| id | department_name |
|----|-----------------|
| 1  | 销售部          |
| 2  | 技术部          |
| 4  | 人事部          |

#### 1. 内连接（INNER JOIN）

**查询语句：**
```sql
SELECT employees.name, departments.department_name
FROM employees
INNER JOIN departments ON employees.department_id = departments.id;
```

**结果：**
| name | department_name |
|------|-----------------|
| 张三 | 销售部          |
| 李四 | 技术部          |

**解释：**
内连接只返回两个表中 `department_id` 和 `id` 能成功匹配的行。
- 员工"王五"的 `department_id` 是 `NULL`，在部门表中找不到对应项，所以不出现。
- 员工"赵六"的 `department_id` 是 3，部门表中没有 id 为 3 的部门，所以不出现。
- 部门"人事部"的 id 是 4，员工表中没有人的 `department_id` 是 4，所以不出现。

#### 2. 左外连接（LEFT OUTER JOIN）

**查询语句：**
```sql
SELECT employees.name, departments.department_name
FROM employees
LEFT OUTER JOIN departments ON employees.department_id = departments.id;
```

**结果：**
| name | department_name |
|------|-----------------|
| 张三 | 销售部          |
| 李四 | 技术部          |
| 王五 | `NULL`          |
| 赵六 | `NULL`          |

**解释：**
左外连接以 **左表 (employees)** 为基准。左表的所有记录都会出现在结果中。
- 对于能匹配上的（张三、李四），正常显示部门名称。
- 对于不能匹配上的（王五、赵六），因为左表记录必须保留，所以右表部分用 `NULL` 填充。

**使用场景：**
查询所有员工的信息，无论他们是否被分配了部门。

#### 3. 右外连接（RIGHT OUTER JOIN）

**查询语句：**
```sql
SELECT employees.name, departments.department_name
FROM employees
RIGHT OUTER JOIN departments ON employees.department_id = departments.id;
```

**结果：**
| name | department_name |
|------|-----------------|
| 张三 | 销售部          |
| 李四 | 技术部          |
| `NULL` | 人事部        |

**解释：**
右外连接以 **右表 (departments)** 为基准。右表的所有记录都会出现在结果中。
- 对于能匹配上的（销售部、技术部），正常显示员工姓名。
- 对于不能匹配上的（人事部），因为右表记录必须保留，所以左表部分用 `NULL` 填充。

**使用场景：**
查询所有部门的信息，无论部门中是否有员工。

#### 总结对比表

| 连接类型 | 中文名 | 关键字 | 结果集侧重 | 图示（以左表A，右表B为例） |
| :--- | :--- | :--- | :--- | :--- |
| **内连接** | 内连接 | `INNER JOIN` | **A和B的交集** | 只返回A和B能匹配的行 |
| **左外连接** | 左连接 | `LEFT OUTER JOIN` | **左表A的全部** | 返回A的所有行，B无匹配则补NULL |
| **右外连接** | 右连接 | `RIGHT OUTER JOIN` | **右表B的全部** | 返回B的所有行，A无匹配则补NULL |

> **提示**：在大多数实际开发中，`OUTER` 关键字可以省略，直接使用 `LEFT JOIN` 和 `RIGHT JOIN`。

#### 补充：全外连接

除了以上三种，还有一种**全外连接**，它结合了左连接和右连接的特点，返回左右两表的全部记录，无论是否匹配。不匹配的部分都用 `NULL` 填充。

- **关键字**：`FULL OUTER JOIN` 或 `FULL JOIN`
- **结果**：是左连接和右连接的**并集**。

对于上面的例子，全外连接的结果会是：
| name | department_name |
|------|-----------------|
| 张三 | 销售部          |
| 李四 | 技术部          |
| 王五 | `NULL`          |
| 赵六 | `NULL`          |
| `NULL` | 人事部        |

**注意**：MySQL 数据库**不支持** `FULL OUTER JOIN`，但可以通过组合 `LEFT JOIN` 和 `RIGHT JOIN` 使用 `UNION` 来达到同样效果。

## 【引流引导】

掌握了JOIN的基本概念，想要在面试中更加游刃有余吗？

我开发了一个**AI面试助手小程序**，里面不仅有完整的大数据面试题库，还能根据你的简历进行个性化的面试辅导。无论是Hive、Spark、还是其他大数据技术栈，都能帮你系统性地准备。

扫描下方小程序码，让AI成为你的面试教练，助你拿到心仪的offer！

*小程序搜索"AI面试助手"即可体验*