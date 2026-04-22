/**
 * @swagger
 * /api/user/s3-url:
 *   get:
 *     summary: Get a presigned S3 URL for file upload
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *           example: profile-pic.jpg
 *       - in: query
 *         name: fileType
 *         required: true
 *         schema:
 *           type: string
 *           example: image/jpeg
 *     responses:
 *       200:
 *         description: Returns presigned URL and S3 key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: https://bucket.s3.amazonaws.com/...
 *                 key:
 *                   type: string
 *                   example: 1712345678-profile-pic.jpg
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/user/update/{id}:
 *   post:
 *     summary: Update a user's profile
 *     tags: [User]
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
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: newpassword123
 *               avatar:
 *                 type: string
 *                 example: https://bucket.s3.amazonaws.com/avatar.jpg
 *     responses:
 *       200:
 *         description: Returns updated user object (password excluded)
 *       401:
 *         description: You can only update your own account
 */

/**
 * @swagger
 * /api/user/delete/{id}:
 *   delete:
 *     summary: Delete a user account
 *     tags: [User]
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
 *         description: User deleted and cookie cleared
 *       401:
 *         description: You can only delete your own account
 */

/**
 * @swagger
 * /api/user/listings/{id}:
 *   get:
 *     summary: Get all listings for a user
 *     tags: [User]
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
 *         description: Returns array of listings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: You can only view your own listings
 */

/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [User]
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
 *         description: Returns user object (password excluded)
 *       404:
 *         description: User not found
 */