using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pharmacy_pos.Data;
using Microsoft.IdentityModel.Tokens;
using Pharmacy_pos.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using Pharmacy_pos.Helper;
namespace Pharmacy_pos.Controllers
{
    public class LoginDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
      
    }
    public class UserEditDto
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string? Password { get; set; } = null;
        public int RoleId { get; set; }
        public string Status { get; set; }
        public IFormFile? ProfilePic { get; set; } = null;
    }
    public class UserDto
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public int RoleId { get; set; }
        public string Status { get; set; }
        public IFormFile? ProfilePic { get; set; } = null;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<RoleAndPermissionController> _logger;
        private readonly IConfiguration _config;
        public UserController(ApplicationDbContext context, ILogger<RoleAndPermissionController> logger, IConfiguration config)
        {
            _context = context;
            _logger = logger;
            _config = config;
        }
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                var user = await _context.User.Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Email == dto.Email && u.Status == "Active");
                if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
                    return Unauthorized("Invalid credentials.");

                // Get permissions for the user's role
                var permissions = await _context.RolePermission
                    .Include(rp => rp.Permission)
                    .Where(rp => rp.RoleId == user.RoleId)
                    .Select(rp => rp.Permission.Name)
                    .ToListAsync();

                var token = GenerateJwtToken(user);
                return Ok(new
                {
                    token,
                    user = new
                    {
                        user.Id,
                        user.Name,
                        user.Email,
                        Role = user.Role?.Name,
                        Permissions = permissions,
                       // Avatar = string.IsNullOrEmpty(user.ProfilePic) ? $"{Request.Scheme}://{Request.Host}/avatars/default.jpeg" : $"{Request.Scheme}://{Request.Host}/{user.ProfilePic}"
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while logging in.");
                return StatusCode(500, $"An error occurred while logging in: {ex.Message}");
            }
        }
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                    return Unauthorized("Invalid user context.");

                var user = await _context.User
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Id == userId && u.Status == "Active");

                if (user == null)
                    return NotFound("User not found.");

                var permissions = await _context.RolePermission
                    .Include(rp => rp.Permission)
                    .Where(rp => rp.RoleId == user.RoleId)
                    .Select(rp => rp.Permission.Name)
                    .ToListAsync();

                return Ok(new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    Role = user.Role?.Name,
                    avatar = string.IsNullOrEmpty(user.ProfilePic) ? $"{Request.Scheme}://{Request.Host}/avatars/default.jpeg" : $"{Request.Scheme}://{Request.Host}/{user.ProfilePic}",
                    Permissions = permissions,
                   
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving the current user.");
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }
        [HttpPost("upload-avatar/{id}")]
        [Authorize]
        public async Task<IActionResult> UploadAvatar(int id, IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest("No file uploaded.");

                var user = await _context.User.FindAsync(id);
                if (user == null)
                    return NotFound("User not found.");

                // Create directory if not exists
                var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars");
                if (!Directory.Exists(uploadsRoot))
                    Directory.CreateDirectory(uploadsRoot);

                // Generate unique file name
                var fileExt = Path.GetExtension(file.FileName);
                var fileName = $"user_{user.Id}_{Guid.NewGuid():N}{fileExt}";
                var filePath = Path.Combine(uploadsRoot, fileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Save relative path to DB (e.g., "avatars/user_1_xxx.jpg")
                var avatarPath = Path.Combine("avatars", fileName).Replace("\\", "/");
                user.ProfilePic = avatarPath;
                await _context.SaveChangesAsync();

                return Ok(new { avatar = avatarPath });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while uploading avatar.");
                return StatusCode(500, $"An error occurred while uploading avatar: {ex.Message}");
            }
        }

        private string GenerateJwtToken(User user)
        {
            try
            {
                var jwtSettings = _config.GetSection("Jwt");
                var claims = new[]
                {
                new Claim(JwtRegisteredClaimNames.Sub, user.Email),
                new Claim("id", user.Id.ToString()),
                new Claim(ClaimTypes.Role, user.Role?.Name ?? "")
            };

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]));
                var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var token = new JwtSecurityToken(
                    issuer: jwtSettings["Issuer"],
                    audience: jwtSettings["Audience"],
                    claims: claims,
                    expires: DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpiresInMinutes"] ?? "60")),
                    signingCredentials: creds
                );

                return new JwtSecurityTokenHandler().WriteToken(token);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding the role .");
                //return StatusCode(500, $"An error occurred while adding the role: {ex.Message}");
                return "";
            }
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> AddUser([FromForm] UserDto dto)
        {
            try
            {
                // Get current user's role
                var userIdClaim = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                    return Forbid("Invalid user context.");

                var currentUser = await _context.User.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
                if (currentUser == null)
                    return Forbid("User not found.");

                // If not SuperAdmin, check permission
                if (!string.Equals(currentUser.Role?.Name, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
                {
                    if (!await HelperFunction.HasPermissionAsync(_context, User, "User.Add"))
                        return Forbid("You do not have permission to add users.");
                }

                if (await _context.User.AnyAsync(u => u.Email == dto.Email))
                    return BadRequest("Email already exists.");

                var user = new User
                {
                    Name = dto.Name,
                    Email = dto.Email,
                    Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                    RoleId = dto.RoleId,
                    Status = dto.Status ?? "Active",
                    CreatedAt = DateTime.UtcNow
                };
                // Handle profile picture upload
                if (dto.ProfilePic != null && dto.ProfilePic.Length > 0)
                {
                    var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars");
                    if (!Directory.Exists(uploadsRoot))
                        Directory.CreateDirectory(uploadsRoot);

                    var fileExt = Path.GetExtension(dto.ProfilePic.FileName);
                    var fileName = $"user_{user.Id}_{Guid.NewGuid():N}{fileExt}";
                    var filePath = Path.Combine(uploadsRoot, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await dto.ProfilePic.CopyToAsync(stream);
                    }

                    user.ProfilePic = Path.Combine("avatars", fileName).Replace("\\", "/");
                }

                _context.User.Add(user);
                await _context.SaveChangesAsync();

                // If profile pic was uploaded, rename file to use user.Id
                if (!string.IsNullOrEmpty(user.ProfilePic))
                {
                    var ext = Path.GetExtension(user.ProfilePic);
                    var newFileName = $"user_{user.Id}{ext}";
                    var oldPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", user.ProfilePic);
                    var newPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars", newFileName);

                    if (System.IO.File.Exists(oldPath))
                    {
                        System.IO.File.Move(oldPath, newPath, true);
                        user.ProfilePic = Path.Combine("avatars", newFileName).Replace("\\", "/");
                        await _context.SaveChangesAsync();
                    }
                }                
                return Ok(new { user.Id, user.Name, user.Email, user.RoleId, user.Status, user.ProfilePic });                
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding the role .");
                return StatusCode(500, $"An error occurred while adding the role: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> EditUser(int id, [FromForm] UserEditDto dto)
        {
            try
            {
                if (!await HelperFunction.HasPermissionAsync(_context, User, "User.Edit"))
                    return Forbid("You do not have permission to edit users.");

                var user = await _context.User.FindAsync(id);
                if (user == null) return NotFound();

                user.Name = dto.Name;
                user.Email = dto.Email;
                if (!string.IsNullOrWhiteSpace(dto.Password))
                    user.Password = BCrypt.Net.BCrypt.HashPassword(dto.Password);
                user.RoleId = dto.RoleId;
                user.Status = dto.Status ?? user.Status;
                if (dto.ProfilePic != null && dto.ProfilePic.Length > 0)
                {
                    var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars");
                    if (!Directory.Exists(uploadsRoot))
                        Directory.CreateDirectory(uploadsRoot);

                    var fileExt = Path.GetExtension(dto.ProfilePic.FileName);
                    var fileName = $"user_{user.Id}{fileExt}";
                    var filePath = Path.Combine(uploadsRoot, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await dto.ProfilePic.CopyToAsync(stream);
                    }

                    user.ProfilePic = Path.Combine("avatars", fileName).Replace("\\", "/");
                }
                await _context.SaveChangesAsync();
                return Ok(new { user.Id, user.Name, user.Email, user.RoleId, user.Status });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding the role .");
                return StatusCode(500, $"An error occurred while adding the role: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                if (!await HelperFunction.HasPermissionAsync(_context, User, "User.Delete"))
                    return Forbid("You do not have permission to delete users.");

                var user = await _context.User.FindAsync(id);
                if (user == null) return NotFound();

                user.Status = "Inactive";
                await _context.SaveChangesAsync();
                return Ok(new { user.Id, user.Name, user.Email, user.Status });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding the role .");
                return StatusCode(500, $"An error occurred while adding the role: {ex.Message}");
            }
        }


        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            // Invalidate the token by removing it from the client-side storage
            // or implementing token blacklisting on the server-side if required.
            return Ok(new { message = "Logout successful." });
        }
        //private async Task<bool> HasPermissionAsync(string permissionName)
        //{
        //    var userIdClaim = User.FindFirst("id")?.Value;
        //    if (string.IsNullOrEmpty(userIdClaim)) return false;
        //    if (!int.TryParse(userIdClaim, out int userId)) return false;

        //    var user = await _context.User.Include(u => u.Role)
        //        .FirstOrDefaultAsync(u => u.Id == userId);
        //    if (user == null) return false;

        //    var hasPermission = await _context.RolePermission
        //        .Include(rp => rp.Permission)
        //        .AnyAsync(rp => rp.RoleId == user.RoleId && rp.Permission.Name == permissionName);

        //    return hasPermission;
        //}

    
      [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                if (!await HelperFunction.HasPermissionAsync(_context, User, "User.Get"))
                    return Forbid("You do not have permission to view users.");

                var users = await _context.User
                    .Include(u => u.Role)
                    .Where(u => u.Status == "Active")
                    .Select(u => new
                    {
                        u.Id,
                        u.Name,
                        u.Email,
                        u.RoleId,
                        Role = u.Role != null ? u.Role.Name : null,
                        u.Status,
                        u.CreatedAt,
                        Avatar = string.IsNullOrEmpty(u.ProfilePic) ? $"{Request.Scheme}://{Request.Host}/avatars/default.jpeg" : $"{Request.Scheme}://{Request.Host}/{u.ProfilePic}"
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching users.");
                return StatusCode(500, $"An error occurred while fetching users: {ex.Message}");
            }
        }
    }
    }
