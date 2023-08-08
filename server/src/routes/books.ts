import { Router } from 'express';
import { Filter, FindOptions, ObjectId } from 'mongodb';
import { Book } from '../models/book.js';
import { collections } from '../database.js';

// The router will be added as a middleware and will take control of requests starting with /books.
const books = Router();
export default books;

books.route('/').get(async (req, res) => {
    let limit = parseInt(req?.query?.limit as string) || 12;

    if (limit > 100) {
        limit = 100;
    }

    const skip = parseInt(req?.query?.skip as string) || 0;
    const filter = {} as Filter<Book>;
    const project = {_id: 0} as FindOptions<Book>;

    const bookCursor = await collections?.books?.find(filter, project);
    const books = bookCursor.limit(limit).skip(skip).toArray();

    return res.json(await books);
});

books.route('/').post(async (req, res) => {
    const book = req?.body;

    if (!book || Object.keys(book).length === 0) {
        return res.status(400).send('Book details are missing');
    }

    const result = await collections?.books?.insertOne(book);

    if (result?.insertedId) {
        return res.status(201).send(`Created a new book with id ${result.insertedId}`);
    }

    return res.status(500).send('Failed to create a new book');
});

books.route('/:id').get(async (req, res) => {
    const id = req?.params?.id;

    if (!id) {
        return res.status(400).send('Book id is missing');
    }

    const book = await collections?.books?.findOne({ _id: id });

    if (book) {
        return res.json(book);
    }

    return res.status(404).send(`Book with id ${id} was not found`);
});

books.route('/:id').put(async (req, res) => {
    const id = req?.params?.id;
    const book = req?.body;

    if (!id) {
        return res.status(400).send('Book id is missing');
    }

    if (!book || Object.keys(book).length === 0) {
        return res.status(400).send('Book details are missing');
    }

    const result = await collections?.books?.updateOne({ _id: id }, { $set: book });

    if (result?.modifiedCount) {
        return res.send(`Updated book with id ${id}`);
    }

    return res.status(500).send(`Failed to update book with id ${id}`);
});

books.route('/:id').delete(async (req, res) => {
    const id = req?.params?.id;

    if (!id) {
        return res.status(400).send('Book id is missing');
    }

    try {
        const result = await collections?.books?.deleteOne({ _id: id });

        if (result?.deletedCount) {
            res.status(202).send(`Removed book with id ${id}`);
        } else if (!result) {
            res.status(400).send(`Book with id ${id} does not exist`);
        } else if (!result.deletedCount) {
            res.status(404).send(`Book with id ${id} was not found`);
        }
    } catch (error) {
        console.error(error.message);
        return res.status(500).send(`Failed to delete book with id ${id}`);
    }
});

books.route('/:id/reviews').get(async (req, res) => {
    const id = req?.params?.id;

    if (!id) {
        return res.status(400).send('Book id is missing');
    }

    try {
        const reviews = await collections?.reviews?.find({ bookId: id }).toArray();
        return res.json(reviews);
    } catch (error) {
        console.error(error.message);
        return res.status(500).send(`Failed to get reviews for book with id ${id}`);
    }
});

books.route('/:id/reviews').post(async (req, res) => {
    const id = req?.params?.id;
    const review = req?.body;

    if (!id) {
        return res.status(400).send('Book id is missing');
    }

    if (!review) {
        return res.status(400).send('Review details are missing');
    }

    review.bookId = id;
    const result = await collections?.reviews?.insertOne(review);

    if (result?.insertedId) {
        return res.status(201).send(`Created a new review with id ${result.insertedId}`);
    }

    return res.status(500).send('Failed to create a new review');
});

books.route('/:id/reviews/:reviewId').get(async (req, res) => {
    const id = req?.params?.id;
    const reviewId = req?.params?.reviewId;

    if (!id) {
        return res.status(400).send('Book id is missing');
    }

    if (!reviewId) {
        return res.status(400).send('Review id is missing');
    }

    const review = await collections?.reviews?.findOne({ _id: new ObjectId(reviewId), bookId: id });


    if (review) {
        return res.json(review);
    }

    return res.status(404).send(`Review with id ${reviewId} was not found`);
});