from app.core.rbac import has_perm


def test_user_cannot_admin():
    assert has_perm("user", "commitments:write:own")
    assert not has_perm("user", "metrics:read")


def test_ops_cannot_read_memories():
    assert has_perm("ops_admin", "users:read")
    assert not has_perm("ops_admin", "memories:read:own")


def test_super_admin_wildcard():
    assert has_perm("super_admin", "anything:at:all")
