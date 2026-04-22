/**
 * @swagger
 * /api/listing/create:
 *   post:
 *     summary: Create a new listing
 *     tags: [Listing]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - fuelType
 *               - yom
 *               - userRef
 *             properties:
 *               name:
 *                 type: string
 *                 example: Toyota Camry
 *               description:
 *                 type: string
 *                 example: Well maintained, single owner
 *               type:
 *                 type: string
 *                 enum: [sale, rent]
 *                 example: sale
 *               fuelType:
 *                 type: string
 *                 enum: [petrol, diesel]
 *                 example: petrol
 *               yom:
 *                 type: integer
 *                 example: 2019
 *               engine:
 *                 type: string
 *                 example: 2.5L V6
 *               offer:
 *                 type: boolean
 *                 example: false
 *               userRef:
 *                 type: string
 *                 example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     responses:
 *       201:
 *         description: Listing created successfully
 *       401:
 *         description: Unauthorized
*/

/**
 * @swagger
 * /api/listing/delete/{id}:
 *   delete:
 *     summary: Delete a listing
 *     tags: [Listing]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     responses:
 *       200:
 *         description: Listing deleted successfully
 *       401:
 *         description: You can only delete your own listings
 *       404:
 *         description: Listing not found
 */

/**
 * @swagger
 * /api/listing/update/{id}:
 *   post:
 *     summary: Update a listing
 *     tags: [Listing]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Toyota Camry
 *               description:
 *                 type: string
 *                 example: Updated description
 *               type:
 *                 type: string
 *                 enum: [sale, rent]
 *                 example: rent
 *               fuelType:
 *                 type: string
 *                 enum: [petrol, diesel]
 *                 example: diesel
 *               yom:
 *                 type: integer
 *                 example: 2020
 *               engine:
 *                 type: string
 *                 example: 2.0L Turbo
 *               offer:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Returns updated listing
 *       401:
 *         description: You can only update your own listings
 *       404:
 *         description: Listing not found
 */

/**
 * @swagger
 * /api/listing/get/{id}:
 *   get:
 *     summary: Get a single listing by ID
 *     tags: [Listing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     responses:
 *       200:
 *         description: Returns the listing
 *       404:
 *         description: Listing not found
 */

/**
 * @swagger
 * /api/listing/get:
 *   get:
 *     summary: Get listings with filters, search and pagination
 *     tags: [Listing]
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *           example: Toyota
 *         description: Search by listing name
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sale, rent, all]
 *           example: sale
 *         description: Filter by listing type
 *       - in: query
 *         name: fuelType
 *         schema:
 *           type: string
 *           enum: [petrol, diesel, all]
 *           example: petrol
 *         description: Filter by fuel type
 *       - in: query
 *         name: offer
 *         schema:
 *           type: boolean
 *           example: true
 *         description: Filter by offer status
 *       - in: query
 *         name: engine
 *         schema:
 *           type: string
 *           example: V6
 *         description: Partial match search on engine field
 *       - in: query
 *         name: yomMin
 *         schema:
 *           type: integer
 *           example: 2015
 *         description: Minimum year of manufacture
 *       - in: query
 *         name: yomMax
 *         schema:
 *           type: integer
 *           example: 2023
 *         description: Maximum year of manufacture
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           example: desc
 *         description: Sort order
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 9
 *         description: Number of results per page (default 9)
 *       - in: query
 *         name: startIndex
 *         schema:
 *           type: integer
 *           example: 0
 *         description: Pagination offset (default 0)
 *     responses:
 *       200:
 *         description: Returns array of matching listings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */