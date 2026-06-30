import { Request, Response } from "express";
import db from "../config/db.js";
import { askGemini } from "../services/geminiService.js";

export const getAllArticles = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const search = (req.query.search as string) || "";
    const category = (req.query.category as string) || "";

    const sortBy = (req.query.sortBy as string) || "created_at";
    const order =
      (req.query.order as string)?.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const offset = (page - 1) * limit;

    const values: any[] = [];
    let whereClause = "WHERE 1=1";

    if (search) {
      values.push(`%${search}%`);
      whereClause += `
        AND (
          title ILIKE $${values.length}
          OR description ILIKE $${values.length}
          OR category ILIKE $${values.length}
        )`;
    }

    if (category) {
      values.push(category);
      whereClause += ` AND category = $${values.length}`;
    }

    // Total Count
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM articles
      ${whereClause}
    `;

    const countResult = await db.query(countQuery, values);

    // Query Data
    values?.push(limit);
    values?.push(offset);

    const query = `
      SELECT *
      FROM articles
      ${whereClause}
      ORDER BY ${sortBy} ${order}
      LIMIT $${values.length - 1}
      OFFSET $${values.length}
    `;

    const result = await db.query(query, values);
    const total = Number(countResult.rows[0].total);

    if (search && result.rows.length === 0) {
      const answer = await askGemini(search);

      return res.json({
        success: true,
        source: "gemini",
        pagination: {
          page,
          limit,
          totalRecords: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        filters: {
          search,
          category,
          sortBy,
          order,
        },
        data: [],
        answer,
      });
    }

    res.json({
      success: true,
      source: "database",

      pagination: {
        page,
        limit,
        totalRecords: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },

      filters: {
        search,
        category,
        sortBy,
        order,
      },

      data: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Database Error",
    });
  }
};
export const getArticleById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await db.query("SELECT * FROM articles WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Article not found",
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Database Error",
    });
  }
};

export const createArticle = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      title,
      category,
      description,
      author_first_name,
      author_last_name,
      author_email,
    } = req.body;

    const result = await db.query(
      `INSERT INTO articles
      (
        title,
        category,
        description,
        author_first_name,
        author_last_name,
        author_email
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        title,
        category,
        description,
        author_first_name,
        author_last_name,
        author_email,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Article Created Successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Database Error",
    });
  }
};

export const deleteArticle = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await db.query(
      "DELETE FROM articles WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "Article not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Article deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Database Error",
    });
  }
};
