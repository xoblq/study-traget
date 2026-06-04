-- 尝试创建 vector 扩展 (pgvector)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pgvector 扩展不可用，将使用普通的 double precision[] 存储向量并使用自定义函数计算相似度。';
END $$;

-- 创建文档主表
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    size INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 根据扩展可用情况动态创建切片向量表
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') THEN
        -- 启用 pgvector
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'document_chunks') THEN
            CREATE TABLE document_chunks (
                id SERIAL PRIMARY KEY,
                document_id INT REFERENCES documents(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                embedding vector(1536) NOT NULL,
                chunk_index INT NOT NULL
            );
        END IF;
    ELSE
        -- 降级为双精度浮点数数组
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'document_chunks') THEN
            CREATE TABLE document_chunks (
                id SERIAL PRIMARY KEY,
                document_id INT REFERENCES documents(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                embedding double precision[] NOT NULL,
                chunk_index INT NOT NULL
            );
        END IF;
    END IF;
END $$;

-- 创建 PL/pgSQL 余弦相似度计算函数 (在没有 pgvector 时作为核心回退手段)
CREATE OR REPLACE FUNCTION cosine_similarity(a double precision[], b double precision[])
RETURNS double precision AS $$
DECLARE
    dot_product double precision := 0;
    norm_a double precision := 0;
    norm_b double precision := 0;
    i integer;
BEGIN
    IF array_length(a, 1) IS NULL OR array_length(b, 1) IS NULL OR array_length(a, 1) != array_length(b, 1) THEN
        RETURN 0;
    END IF;
    FOR i IN 1..array_length(a, 1) LOOP
        dot_product := dot_product + (a[i] * b[i]);
        norm_a := norm_a + (a[i] * a[i]);
        norm_b := norm_b + (b[i] * b[i]);
    END LOOP;
    IF norm_a = 0 OR norm_b = 0 THEN
        RETURN 0;
    END IF;
    RETURN dot_product / (sqrt(norm_a) * sqrt(norm_b));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
