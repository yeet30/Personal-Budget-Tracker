UPDATE category
SET category_type = 'INCOME'
WHERE name IN ('self-employment', 'addition', 'salary', 'savings');